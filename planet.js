class Planet {
	/**
	 * Constructs an instance representing a planet.
	 * Calls rebuild()
	 * @param seed the seed for this planet
	 * @param traits a dict mapping traits to values
	 */
	constructor(seed, traits) {
		this.seed = seed;
		this.traits = traits;

		this.rebuild();
	}

	/**
	 * Rebuilds noise generator and clouds.
	 * Must be called to fully reflect changes in planet traits.
	 */
	rebuild() {
		console.log("rebuild")
		this.noise = new Noise(this.seed);
		this.clouds = this._makeClouds();
	}

	/**
	 * Compute the height of the planet surface at a given coordinate.
	 * Note that the coordinate *must be* on the planet surface, otherwise the
	 * result is nonsense.
	 * @param x x coordinate
	 * @param y y coordinate
	 * @param z z coordinate
	 * @returns height of the planet terrain
	 */
	heightAt(x, y, z) {
		//compute one octave of noise
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

		//combine octaves
		return n1+n2+n3;
	}

	/**
	 * Get the type of terrain at a given coordinate.
	 * Depends on Planet.heightAt()
	 * Note that the coordinate *must be* on the planet surface, otherwise the
	 * result is nonsense.
	 * @param x x coordinate
	 * @param y y coordinate
	 * @param z z coordinate
	 * @returns a Terrain instance representing the terrain type
	 */
	terrainAt(x, y, z) {
		const waterLevel = this.traits.water;
		const h = this.heightAt(x, y, z);
		if (h === 0)
			return Terrain.ERROR;
		
		if (h < waterLevel)
			return Terrain.WATER;
		
		const lh = h - waterLevel;
		if (lh < 0.1)
			return Terrain.BEACH;
		return Terrain.LAND;
	}

	/**
	 * Renders the terrain of a planet.
	 * Thanks to:
	 * https://stackoverflow.com/questions/17839999/drawing-a-rotating-sphere-by-using-a-pixel-shader-in-direct3d
	 * https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
	 */
	render(camera, imageData, destCtx) {
		const data = imageData.data;
		const {w, h, rotX, rotY, rotZ} = camera;
		const planetSize = this.traits.size;

		for (let x=0; x<w; ++x) {
			for (let y=0; y<h; ++y) {
				const idx = (y*w+x)*4;

				//compute 2D vector
				const dx = (x - w/2) / (w/2);
				const dy = (y - h/2) / (h/2);
				const d = Math.sqrt(dx*dx + dy*dy);
				if (d > planetSize) {
					data[idx+3] = 0;
					continue;
				}

				//map to 3D coordinate on sphere
				let x1 = dx;
				let y1 = dy;
				let z1 = Math.sqrt(planetSize**2 - dx*dx - dy*dy);

				//store pre-rotation coordinates
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
				const terrain = this.terrainAt(x1, y1, z1);
				let [r,g,b] = terrain.color;

				// let brightFactor = Math.round(z1 * 8) / 8;
				// brightFactor = Math.min(1, brightFactor);
				// let bright = brightFactor * 0.5 + 0.5;
				// r *= bright;
				// g *= bright;
				// b *= bright;

				//write color
				data[idx+0] = Math.max(0, Math.min(255, ~~r));
				data[idx+1] = Math.max(0, Math.min(255, ~~g));
				data[idx+2] = Math.max(0, Math.min(255, ~~b));
				data[idx+3] = 255;
			}
		}
	}

	_makeClouds() {
		const N = 5000;
		const {size, atmoDensity, cloudDensity} = this.traits; 
		
		let out = [];
		let ni = 0;
		for (let i=0; i<N; i++) {
			//random spherical coordinate
			const r = size + 0.05 + this.noise.rand(ni++) * this.noise.rand(ni++) * 0.3 * atmoDensity;
			const t = this.noise.rand(ni++)*2*Math.PI;
			const p = this.noise.rand(ni++)*1*Math.PI;

			//convert to cartesian
			const x = r * Math.cos(t) * Math.sin(p);
			const y = r * Math.sin(t) * Math.sin(p);
			const z = r * Math.cos(p);

			//cloud intensity
			const min = cloudDensity;
			const v = this.noise.perlin3d(x*2,y*4,z*2) + 0.5;
			if (v > min)
				continue;

			out.push(new Particle({
				x, y, z,
				radius: (min - v) / min * 4,
				color: "rgba(255,255,255,0.9)"
			}));
		}
		return out;
	}
}