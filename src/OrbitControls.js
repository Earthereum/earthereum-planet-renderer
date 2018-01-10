export default class OrbitControls {
	constructor(displayElement, speed=0.05, friction=0.08) {
		this.displayElement = displayElement;
		this.rotX = 0.3;
		this.rotY = 0;
		
		this.velX = 0;
		this.velY = 0;

		this._prevtime = Date.now();
		this.speed = speed;
		this.friction = 1-friction;

		this.mouse = {
			down: false,
			x: 0,
			y: 0
		};

		this.addListeners();
	}

	addListeners() {
		const handleDown = this.eDown.bind(this);
		const handleMove = this.eMove.bind(this);
		const handleUp = this.eUp.bind(this);
		document.addEventListener("mousedown", handleDown, false);
		document.addEventListener("mousemove", handleMove, false);
		document.addEventListener("mouseup", handleUp, false);
		this.removeListeners = () => {
			document.removeEventListener("mousedown", handleDown);
			document.removeEventListener("mousemove", handleMove);
			document.removeEventListener("mouseup", handleUp);
		};
	}

	update() {
		const dt = (Date.now() - this._prevtime)/1000;
		
		this.rotX += this.velX * this.speed * dt;
		this.rotY += this.velY * this.speed * dt;
		this.velX *= this.friction;
		this.velY *= this.friction;

		this.rotX = Math.min(Math.PI * 0.5, Math.max(-Math.PI * 0.5, this.rotX));

		this._prevtime = Date.now();
	}

	eDown(event) {
		if (event.target === this.displayElement) {
			event.preventDefault();
			this.mouse.down = true;
			this.mouse.x = event.pageX;
			this.mouse.y = event.pageY;
		}
	}

	eUp(event) {
		if (this.mouse.down)
			event.preventDefault();

		this.mouse.down = false;
	}

	eMove(event) {
		let oldX = this.mouse.x;
		let oldY = this.mouse.y;
		this.mouse.x = event.pageX;
		this.mouse.y = event.pageY;
		
		if (this.mouse.down) {
			event.preventDefault();

			this.velY -= this.mouse.x - oldX;
			this.velX += this.mouse.y - oldY;
		}
	}
}
