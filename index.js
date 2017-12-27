class Planets {
	static init() {
		Planets.canvas = document.querySelector("#display");
		Planets.canvas.width = 500;
		Planets.canvas.height = 500;
		Planets.ctx = Planets.canvas.getContext("2d");
		Planets.ctx.imageSmoothingEnabled = false;

		Planets.bufData = new ImageData(Planets.RENDER_W, Planets.RENDER_H);

		Planets.current = new Planet(0xDEADBEEF);
		requestAnimationFrame(Planets.update);
	}

	static async update() {
		const planet = Planets.current;
		const data = Planets.bufData.data;
		const w = Planets.RENDER_W;
		const h = Planets.RENDER_H;

		const t = Date.now()/500;
		const p3d = planet.noise.perlin3d;
		for (let x=0; x<w; ++x) {
			for (let y=0; y<h; ++y) {
				//compute color
				let col;
				const dx = (x - w/2) / (w/2);
				const dy = (y - h/2) / (h/2);
				const d = Math.sqrt(dx*dx + dy*dy);
				col = d < 0.5 ? [255,0,0] : [0,0,0];

				//write color
				const idx = (y*w+x)*4;
				data[idx+0] = col[0];
				data[idx+1] = col[1];
				data[idx+2] = col[2];
				data[idx+3] = 255;
			}
		}

		const bmp = await createImageBitmap(Planets.bufData);
		const ctx = Planets.ctx;
		ctx.drawImage(bmp, 0, 0, Planets.canvas.width, Planets.canvas.height);
		bmp.close();

		requestAnimationFrame(Planets.update);
	}
}
Planets.RENDER_W = 256;
Planets.RENDER_H = 256;

class Planet {
	constructor(seed) {
		this.noise = new Noise(seed);

		//create attributes for planet
		this.size = this.noise.rand(0) + 1;
		this.water = this.noise.rand(1) ** 2;
	}

	heightAt(r, t, p) {
		const coord = Planet.sphere2rect(r, t, p);
		return this.noise.perlin3d(coord) + 0.5;
	}

	typeAt(r, t, p) {
		const h = this.heightAt(r, t, p);
		if (h < this.water)
			return Terrain.WATER;
		return Terrain.ROCK;
	}

	static rect2sphere(x, y, z) {
		return {
			r: Math.sqrt(x**2 + y**2 + z**2),
			t: Math.acos(z/r),
			p: Math.atan2(y,x)
		}
	}

	static sphere2rect(r, t, p) {
		return {
			x: r * Math.sin(t) * Math.cos(p),
			y: r * Math.sin(t) * Math.sin(p),
			z: r * Math.cos(t)
		};
	}
}

class Terrain {
	static colorFor(type) {
		switch (type) {
			case Terrain.ROCK:
				return [128,100,80];
			case Terrain.WATER:
				return [200,110,50];
			default:
				return [255,0,255];
		}
	}
}
Terrain.ROCK = 1;
Terrain.WATER = 2;

window.onload = (event) => Planets.init();