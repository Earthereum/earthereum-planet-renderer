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

		Planets.buffer = document.createElement("canvas");
		Planets.buffer.width = Planets.RENDER_W;
		Planets.buffer.height = Planets.RENDER_H;
		Planets.bctx = Planets.buffer.getContext("2d");

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
		const w = Planets.RENDER_W;
		const h = Planets.RENDER_H;

		Planets.orbitControls.update();

		const time = Date.now()/1000;
		const rotX = Planets.orbitControls.rotX;
		const rotY = time*0.4 + Planets.orbitControls.rotY;
		const rotZ = 0;

		const cam = {w, h, rotX, rotY, rotZ};
		
		PlanetRenderer.render(cam, planet, Planets.bufData);

		createImageBitmap(Planets.bufData).then(bmp => {
			const canvas = Planets.canvas;
			Planets.bctx.clearRect(0, 0, w, h);
			Planets.bctx.drawImage(bmp, 0, 0);
			bmp.close();

			ParticleRenderer.render(planet, cam, planet.clouds, Planets.bctx);
			
			Planets.ctx.clearRect(0, 0, canvas.width, canvas.height);
			Planets.ctx.drawImage(Planets.buffer, 0, 0, canvas.width, canvas.height);
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

		//create clouds
		this.clouds = this._makeClouds();
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

	_makeClouds() {
		const N = 500;
		let out = [];
		for (let i=0; i<N; i++) {
			const y = Math.random()*0.1;
			const dir = Math.random()*2*Math.PI;
			const len = this.size + Math.random()*0.5 + 0.2;
			const x = Math.cos(dir) * len;
			const z = Math.sin(dir) * len;

			out.push(new Particle({
				x, y, z,
				radius: 2,
				color: "white"
			}));
		}
		return out;
	}
}

class Particle {
	constructor({x, y, z, radius, color}) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.radius = radius;
		this.color = color;
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

class PlanetRenderer {
	static render(camera, planet, imageData, destCtx) {
		const data = imageData.data;
		const {w, h, rotX, rotY, rotZ} = camera;

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
				if (rotX !== 0) {
					const yt = y1, zt = z1;
					y1 = yt * Math.cos(rotX) - zt * Math.sin(rotX);
					z1 = yt * Math.sin(rotX) + zt * Math.cos(rotX);
				}
				if (rotY !== 0) {
					const zt = z1, xt = x1;
					x1 = zt * Math.sin(rotY) + xt * Math.cos(rotY);
					z1 = zt * Math.cos(rotY) - xt * Math.sin(rotY);
				}
				if (rotZ !== 0) {
					const xt = x1, yt = y1;
					x1 = xt * Math.cos(rotZ) - yt * Math.sin(rotZ);
					y1 = xt * Math.sin(rotZ) + yt * Math.cos(rotZ);
				}

				//compute color
				const terrain = planet.terrainAt(x1, y1, z1);
				let [r,g,b] = terrain.color;

				let brightFactor = Math.round(z1 * 8) / 8;
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

		
	}
}

class ParticleRenderer {
	static render(planet, camera, particles, destCtx) {
		let {rotX, rotY, rotZ, w, h} = camera;
		const cx = w * 0.5, cy = h * 0.5;

		for (let p of particles) {
			let x1 = p.x, y1 = p.y, z1 = p.z;

			//apply rotation
			if (rotY !== 0) {
				const zt = z1, xt = x1;
				x1 = zt * Math.sin(rotY) + xt * Math.cos(rotY);
				z1 = zt * Math.cos(rotY) - xt * Math.sin(rotY);
			}
			if (rotX !== 0) {
				const yt = y1, zt = z1;
				y1 = yt * Math.cos(rotX) - zt * Math.sin(rotX);
				z1 = yt * Math.sin(rotX) + zt * Math.cos(rotX);
			}
			if (rotZ !== 0) {
				const xt = x1, yt = y1;
				x1 = xt * Math.cos(rotZ) - yt * Math.sin(rotZ);
				y1 = xt * Math.sin(rotZ) + yt * Math.cos(rotZ);
			}

			const planetZ = Math.sqrt(planet.size**2 - x1*x1 - y1*y1);
			if (z1 > planetZ)
				continue;

			destCtx.fillStyle = p.color;

			const size = p.radius;
			destCtx.fillRect(
				Math.floor(x1 * cx + cx - size/2),
				Math.floor(y1 * cy + cy - size/2),
				Math.floor(size), Math.floor(size));
			destCtx.globalAlpha = 1;
		}
	}
}

class OrbitControls {
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