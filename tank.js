import PoweredUP from "node-poweredup";
import { argv } from 'process';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { TiltQueue } from "./tilt_q.js";

class Tank {
    constructor({
        engineLeft,
        engineRight,
        steeringAxis,
        sensor
    }) {
        this.engineLeft = engineLeft;
        this.engineRight = engineRight;
        this.tiltQueue = new TiltQueue({
            steeringAxis,
            sensor
        });
    }

    static async connect({
        hub,
        engineLeftPort,
        engineRightPort,
        sensorType,
        steeringAxis
    }) {
        await hub.connect();
        const engineLeft = await hub.waitForDeviceAtPort(engineLeftPort);
        const engineRight = await hub.waitForDeviceAtPort(engineRightPort);
        const sensors = await hub.getDevicesByType(sensorType);
        if (sensors.length === 0) {
            throw new Error("No sensor found");
        }
        if (sensors.length > 1) {
            throw new Error("Multiple sensors found");
        }
        const sensor = sensors[0];
        const tank = new Tank({
            steeringAxis,
            sensor,
            engineLeft,
            engineRight
        });
        return tank;
    }

    async turn(degree) {
        const curr = this.tiltQueue.currentAngle;
        const target = curr + degree;
        // start turning async, wait for tilt, notice that the steering axis is inverted
        if (degree > 0) {
            this.engineLeft.setPower(-50);
            this.engineRight.setPower(-50);
        } else {
            this.engineLeft.setPower(50);
            this.engineRight.setPower(50);
        }
        await this.tiltQueue.waitForAngle(target);
        // Return steering wheel to center after reaching the desired angle
        this.engineLeft.setPower(0);
        this.engineRight.setPower(0);
    }

    async setPower(power) {
        await this.engineLeft.setPower(power);
        await this.engineRight.setPower(-power);
    }

    async wait(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async do(cmd) {
        const { action, argument} = cmd;
        switch (action) {
            case 'FD':
                await this.setPower(argument);
                break;
            case 'BK':
                await this.setPower(-argument);
                break;
            case 'RT':
                await this.turn(argument);
                break;
            case 'LT':
                await this.turn(-argument);
                break;
            case 'WT':
                await this.wait(argument);
                break;
        }
    }

    async run(seq) {
        for (const cmd of seq) {
            await this.do(cmd);
        }
        await this.setPower(0);
    }
}

class TankCtrl {
    constructor() {
        this.tank = null;
    }

    async discover() {
        const poweredUP = new PoweredUP.PoweredUP();
        poweredUP.once("discover", async (hub) => {
            console.log(`Found hub: ${hub.name}`);
            poweredUP.stop();
            this.tank = await Tank.connect({
                hub,
                engineLeftPort: "A",
                engineRightPort: "B",
                sensorType: PoweredUP.Consts.DeviceType.TECHNIC_MEDIUM_HUB_TILT_SENSOR,
                steeringAxis: 'z'
            });
            console.log(`Connected to hub: ${hub.name}`);
        });
        console.log("Scanning for PoweredUP hubs...");
        await poweredUP.scan();
    }

    async run(seq) {
        if (!this.tank) {
            throw new Error("Tank not connected");
        }
        await this.tank.run(seq);
    }
}

export { Tank, TankCtrl };