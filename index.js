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

		const time = Date.now()/500;
		const p3d = planet.noise.perlin3d;
		for (let x=0; x<w; ++x) {
			for (let y=0; y<h; ++y) {
				//compute 2D vector
				const dx = (x - w/2) / (w/2);
				const dy = (y - h/2) / (h/2);
				const d = Math.sqrt(dx*dx + dy*dy);
				if (d > 1)
					continue;
				// const a = Math.atan2(dy, dx);

				//map to spherical surface
				let coord = Coord.plane2rect(dx, dy);
				coord = Coord.rotateX(coord.x, coord.y, coord.z, Math.PI * 0.30);
				coord = Coord.rect2sphere(coord.x, coord.y, coord.z);
				coord.t += time;

				//compute color
				const type = planet.typeAt(coord.r,coord.t,coord.p);
				// const col = Terrain.colorFor(type);
				const col = d <= 1 ? [
					0,
					coord.t%(Math.PI*2)*40,
					127] 
					: [0,0,0];

				//write color
				const idx = (y*w+x)*4;
				data[idx+0] = Math.max(0, Math.min(255, ~~col[0]));
				data[idx+1] = Math.max(0, Math.min(255, ~~col[1]));
				data[idx+2] = Math.max(0, Math.min(255, ~~col[2]));
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
		this.water = 0.2;
	}

	heightAt(r, t, p) {
		const coord = Coord.sphere2rect(r, t, p);
		return this.noise.perlin3d(coord.x, coord.y, coord.z) + 0.5;
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

class Coord {
	static plane2rect(px, py) {
		const f = 1 + px*px + py*py;
		return {
			x: 2*px / f,
			y: 2*py / f,
			z: (-1 + px*px + py*py) / f
		};
	}

	static plane2sphere(px, py) {
		const coord = Planet.plane2rect(px, py);
		return Planet.rect2sphere(coord.x, coord.y, coord.z);
	}

	static rect2sphere(x, y, z) {
		const r = Math.sqrt(x**2 + y**2 + z**2);
		return {
			r: r,
			t: Math.atan2(y,x),
			p: Math.acos(z/r)
		};
	}

	static sphere2rect(r, t, p) {
		return {
			x: r * Math.sin(t) * Math.cos(p),
			y: r * Math.sin(t) * Math.sin(p),
			z: r * Math.cos(t)
		};
	}

	static rotateX(x, y, z, rad) {
		return {
			x: x,
			y: y * Math.cos(rad) - z * Math.sin(rad),
			z: y * Math.sin(rad) + z * Math.cos(rad)
		};
	}

	static rotateY(x, y, z, rad) {
		return {
			x: z * Math.sin(rad) + x * Math.cos(rad),
			y: y,
			z: z * Math.cos(rad) - Math.sin(rad)
		};
	}
}

class Terrain {
	static colorFor(type) {
		switch (type) {
			case Terrain.ROCK:
				return [128,100,80];
			case Terrain.WATER:
				return [50,110,200];
			default:
				return [255,0,255];
		}
	}
}
Terrain.ROCK = 1;
Terrain.WATER = 2;

window.onload = (event) => Planets.init();