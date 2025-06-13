// --- Tilt waiter queue and handler ---
class TiltQueue {
    constructor({steeringAxis, sensor, tollerance = 2}) {
        this.steeringAxis = steeringAxis;
        this.sensor = sensor;
        this.tollerance = tollerance;
        this.queue = [];
        this.currentAngle = null;
        this.processing = false;
        this.sensor.on("tilt", (axes) => {
            this.handleTilt(axes);
        });
    }

    // Called by the tilt event handler
    handleTilt(axes) {
        const angle = axes[this.steeringAxis];
        this.currentAngle = angle;
        this.processQueue();
    }

    // Called by user code to wait for a z value
    waitForAngle(desiredAngle) {
        return new Promise((resolve) => {
            this.queue.push({ desiredAngle, resolve });
            this.processQueue();
        });
    }

    // Only resolve the first waiter, in order
    processQueue() {
        if (this.processing || this.queue.length === 0 || !this.currentAngle) return;
        const { desiredAngle, resolve } = this.queue[0];
        // Check if the current angle is within the tolerance of the desired angle
        console.debug(`Current angle: ${this.currentAngle}, Desired angle: ${desiredAngle}`);
        if (Math.abs(this.currentAngle - desiredAngle) <= this.tollerance) {
            this.processing = true;
            // Remove and resolve the first waiter
            this.queue.shift();
            resolve(this.currentAngle);
            this.processing = false;
            // Process next in queue (in case multiple are satisfied)
            this.processQueue();
        }
    }
}

export { TiltQueue };
