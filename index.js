class Planets {
	static init() {
		Planets.canvas = document.querySelector("#display");
		Planets.canvas.width = 384;
		Planets.canvas.height = 384;
		Planets.ctx = Planets.canvas.getContext("2d");
		Planets.ctx.imageSmoothingEnabled = false;

		Planets.bufData = new ImageData(Planets.RENDER_W, Planets.RENDER_H);

		Planets.current = new Planet(0xdeadbeef);
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

		const time = Date.now()/1000;
		const rotX = time*0.4;
		const rotY = time;
		const rotZ = -time*0.2;

		const p3d = planet.noise.perlin3d;
		for (let x=0; x<w; ++x) {
			for (let y=0; y<h; ++y) {
				//compute 2D vector
				const dx = (x - w/2) / (w/2);
				const dy = (y - h/2) / (h/2);
				const d = Math.sqrt(dx*dx + dy*dy);
				if (d > 1)
					continue;

				//map to 3D coordinate on sphere
				let x1 = dx;
				let y1 = dy;
				let z1 = Math.sqrt(1 - dx*dx - dy*dy);
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
				const type = planet.typeAt(x2, y2, z2);
				const col = Terrain.colorFor(type);

				let bright = z0 + 0.2;
				col[0] *= bright;
				col[1] *= bright;
				col[2] *= bright;

				//write color
				const idx = (y*w+x)*4;
				data[idx+0] = Math.max(0, Math.min(255, ~~col[0]));
				data[idx+1] = Math.max(0, Math.min(255, ~~col[1]));
				data[idx+2] = Math.max(0, Math.min(255, ~~col[2]));
				data[idx+3] = 255;
			}
		}

		createImageBitmap(Planets.bufData).then(bmp => {
			const ctx = Planets.ctx;
			ctx.drawImage(bmp, 0, 0, Planets.canvas.width, Planets.canvas.height);
			bmp.close();

			requestAnimationFrame(Planets.update);
		});
	}
}
Planets.RENDER_W = 128;
Planets.RENDER_H = 128;

class Planet {
	constructor(seed) {
		this.noise = new Noise(seed);

		//create attributes for planet
		this.size = this.noise.rand(0) + 1;
		this.water = this.noise.rand(1) ** 2;
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

		x *= 2;
		y *= 2;
		z *= 2;
		const n3 = this.noise.perlin3d(x, y, z) * 0.25;

		return n1+n2+n3;
	}

	typeAt(r, t, p) {
		const h = this.heightAt(r, t, p);
		if (h === 0)
			return 0;
		if (h < this.water)
			return Terrain.WATER;
		return Terrain.ROCK;
	}
}

class Terrain {
	static colorFor(type) {
		switch (type) {
			case Terrain.ROCK:
				return [234,234,224];
			case Terrain.WATER:
				return [146,171,190];
			default:
				return [255,0,255];
		}
	}
}
Terrain.ROCK = 1;
Terrain.WATER = 2;

window.onload = (event) => Planets.init();