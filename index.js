class Planets {
	static init() {
		Planets.canvas = document.querySelector("#display");
		document.querySelector("#setseed").addEventListener("click", (event)=>{
			const inpt = prompt("Enter an int:");
			const val = Number.parseInt(inpt);
			if (!Number.isNaN(val)) {
				Planets.current = new Planet(val);
			}
			else {
				alert("Oops that's not an int");
			}
		}, false);
		Planets.canvas.width = 450;
		Planets.canvas.height = 450;
		Planets.ctx = Planets.canvas.getContext("2d");
		Planets.ctx.imageSmoothingEnabled = false;

		Planets.bufData = new ImageData(Planets.RENDER_W, Planets.RENDER_H);

		Planets.orbitControls = new OrbitControls(Planets.canvas);

		Planets.current = new Planet(0x42069);
		requestAnimationFrame(Planets.update);
	}

	/**
	 * Renders a planet.
	 * Thanks to:
	 * https://stackoverflow.com/questions/17839999/drawing-a-rotating-sphere-by-using-a-pixel-shader-in-direct3d
	 * https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
	 */
	static update() {
		const planet = Planets.current;
		const data = Planets.bufData.data;
		const w = Planets.RENDER_W;
		const h = Planets.RENDER_H;

		Planets.orbitControls.update();

		const time = Date.now()/1000;
		const rotX = Planets.orbitControls.rotX;
		const rotY = time*0.4 + Planets.orbitControls.rotY;
		const rotZ = 0;

		const p3d = planet.noise.perlin3d;
		for (let x=0; x<w; ++x) {
			for (let y=0; y<h; ++y) {
				const idx = (y*w+x)*4;

				//compute 2D vector
				const dx = (x - w/2) / (w/2);
				const dy = (y - h/2) / (h/2);
				const d = Math.sqrt(dx*dx + dy*dy);
				if (d > planet.size) {
					data[idx+3] = 0;
					continue;
				}

				//map to 3D coordinate on sphere
				let x1 = dx;
				let y1 = dy;
				let z1 = Math.sqrt(planet.size**2 - dx*dx - dy*dy);
				const x0 = x1, y0 = y1, z0 = z1;

				//apply 3D rotation
				let x2=x1, y2=y1, z2=z1;
				if (rotX !== 0) {
					x2 = x1;
					y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
					z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
					x1 = x2;
					y1 = y2;
					z1 = z2;
				}
				if (rotY !== 0) {
					x2 = z1 * Math.sin(rotY) + x1 * Math.cos(rotY);
					y2 = y1;
					z2 = z1 * Math.cos(rotY) - x1 * Math.sin(rotY);
					x1 = x2;
					y1 = y2;
					z1 = z2;
				}
				if (rotZ !== 0) {
					x2 = x1 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
					y2 = x1 * Math.sin(rotZ) + y1 * Math.cos(rotZ);
					z2 = z1;
					x1 = x2;
					y1 = y2;
					z1 = z2;
				}

				//compute color
				const terrain = planet.terrainAt(x2, y2, z2);
				let [r,g,b] = terrain.color;

				let brightFactor = Math.round(z2 * 8) / 8;
				brightFactor = Math.min(1, brightFactor);
				let bright = brightFactor * 0.5 + 0.5;
				r *= bright;
				g *= bright;
				b *= bright;

				//write color
				data[idx+0] = Math.max(0, Math.min(255, ~~r));
				data[idx+1] = Math.max(0, Math.min(255, ~~g));
				data[idx+2] = Math.max(0, Math.min(255, ~~b));
				data[idx+3] = 255;
			}
		}

		createImageBitmap(Planets.bufData).then(bmp => {
			const ctx = Planets.ctx;
			ctx.clearRect(0, 0, Planets.canvas.width, Planets.canvas.height);
			ctx.drawImage(bmp, 0, 0, Planets.canvas.width, Planets.canvas.height);
			bmp.close();

			requestAnimationFrame(Planets.update);
		});
	}
}
Planets.RENDER_W = 150;
Planets.RENDER_H = 150;

class Planet {
	constructor(seed) {
		this.noise = new Noise(seed);

		//create attributes for planet
		this.size = this.noise.rand(0) * 0.5 + 0.5;
		this.water = this.noise.rand(1);
	}

	heightAt(x, y, z) {
		const C = 78151.135;
		x += C;
		y += C;
		z += C;

		x *= 2;
		y *= 2;
		z *= 2;
		const n1 = this.noise.perlin3d(x, y, z) + 0.5;
		
		x *= 2;
		y *= 2;
		z *= 2;
		const n2 = this.noise.perlin3d(x, y, z) * 0.5;

		x *= 4;
		y *= 4;
		z *= 4;
		const n3 = this.noise.perlin3d(x, y, z) * 0.125;

		return n1+n2+n3;
	}

	terrainAt(x, y, z) {
		const h = this.heightAt(x, y, z);
		if (h === 0)
			return Terrain.ERROR;
		
		if (h < this.water)
			return Terrain.WATER;
		
		const lh = h - this.water;
		if (lh < 0.1)
			return Terrain.BEACH;
		return Terrain.LAND;
	}
}

class Terrain {
	constructor({color, albedo}) {
		this.color = color;
		this.albedo = albedo;
	}
}
Terrain.ERROR = new Terrain({color: [255,0,255], albedo: 0});
Terrain.WATER = new Terrain({color: [146,171,190], albedo: 0.8});
Terrain.BEACH = new Terrain({color: [222,222,212], albedo: 0.2});
Terrain.LAND = new Terrain({color: [201,214,169], albedo: 0.2});

class OrbitControls {
	constructor(displayElement, speed=0.05, friction=0.08) {
		this.displayElement = displayElement;
		this.rotX = 0;
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

		document.addEventListener("mousedown", event => this.eDown(event), false);
		document.addEventListener("mousemove", event => this.eMove(event), false);
		document.addEventListener("mouseup", event => this.eUp(event), false);
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

window.onload = (event) => Planets.init();