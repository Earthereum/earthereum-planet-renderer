import {fsin, fcos} from "./FastMath.js";

export default class Particle {
	/**
	 * Constructs a particle instance representing an object floating above
	 * the planet surface.
	 * Pass a dict containing x, y, z, radius, and color
	 */
	constructor({x, y, z, radius, color}) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.radius = radius;
		this.color = color;
	}

	static init() {
		Particle.image = [];
		for (let i=1; i<=Particle.IMAGE_SIZE; i++)
			Particle.image[i] = Particle.makeCircle(i);

		Particle.colorBuffer = document.createElement("canvas");
		Particle.colorBuffer.width = Particle.IMAGE_SIZE;
		Particle.colorBuffer.height = Particle.IMAGE_SIZE;
		Particle.colorCtx = Particle.colorBuffer.getContext("2d");
	}

	static colorCanvas(canvas, color) {
		const buf = Particle.colorBuffer;
		const bctx = Particle.colorCtx;
		const ctx = canvas.getContext("2d");
		const w = canvas.width, h = canvas.height;

		// //increase buffer size if necessary
		if (w > buf.width)
			buf.width = w;
		if (h > buf.height)
			buf.height = h;

		//copy canvas to buffer
		bctx.globalCompositeOperation = "copy";
		bctx.drawImage(canvas, 0, 0);

		//overwrite canvas with desired color
		ctx.globalCompositeOperation = "copy";
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, w, h);

		//mask canvas with its old contents
		ctx.globalCompositeOperation = "destination-in";
		ctx.drawImage(buf, 0, 0);
		return canvas;
	}

	static makeCircle(size) {
		const image = document.createElement("canvas");
		image.width = size;
		image.height = size;

		const ctx = image.getContext("2d");
		const idata = ctx.getImageData(0,0,size,size);
		const data = idata.data;

		for (let x=0; x<size; x++) {
			for (let y=0; y<size; y++) {
				const idx = (y*size+x)*4;

				const dx = (x/size - 0.5) * 2;
				const dy = (y/size - 0.5) * 2;
				const d = Math.sqrt(dx*dx+dy*dy);

				if (d > 1) {
					data[idx+3] = 0;
				}
				else {
					data[idx+0] = 255;
					data[idx+1] = 255;
					data[idx+2] = 255;
					data[idx+3] = 255;
				}
			}
		}

		ctx.putImageData(idata, 0, 0);
		return image;
	}

	/**
	 * Render many particles.
	 * @param planet the planet associated with the particles
	 * @param camera the camera parameters to render with
	 * @param particles an iterable of Particle instances
	 * @param destCtx the CanvasRenderingContext2D on which to render
	 */
	static renderAll(planet, camera, particles, destCtx) {
		let {rotX, rotY, rotZ, w, h} = camera;
		const planetSize = planet.traits.size;

		//recolor images
		if (particles.length > 0) {
			const pcol = particles[0].color;
			for (let i in Particle.image)
				Particle.image[i] = Particle.colorCanvas(Particle.image[i], pcol);
		}

		//screen center
		const cx = w * 0.5, cy = h * 0.5;

		for (let p of particles) {
			const size = p.radius * w;
			if (Math.round(size) < 1)
				continue;

			let x1 = p.x, y1 = p.y, z1 = p.z;

			//apply rotation
			if (rotY !== 0) {
				const zt = z1, xt = x1;
				x1 = zt * fsin(rotY) + xt * fcos(rotY);
				z1 = zt * fcos(rotY) - xt * fsin(rotY);
			}
			if (rotX !== 0) {
				const yt = y1, zt = z1;
				y1 = yt * fcos(rotX) - zt * fsin(rotX);
				z1 = yt * fsin(rotX) + zt * fcos(rotX);
			}
			if (rotZ !== 0) {
				const xt = x1, yt = y1;
				x1 = xt * fcos(rotZ) - yt * fsin(rotZ);
				y1 = xt * fsin(rotZ) + yt * fcos(rotZ);
			}

			//test to see if particle is occluded by planet
			const psize = p.radius;
			const occludedTest = (x, y) => {
				//compute z coord of planet at the position of this particle
				const planetZ = Math.sqrt(planetSize**2 - x**2 - y**2);
				return z1 > planetZ;
			}
			const o0 = occludedTest(x1 - psize, y1 - psize),
				  o1 = occludedTest(x1 + psize, y1 - psize),
				  o2 = occludedTest(x1 - psize, y1 + psize),
				  o3 = occludedTest(x1 + psize, y1 + psize);
			if (o0 && o1 && o2 && o3) //fully occluded
				continue;
			const occluded = o0 || o1 || o2 || o3; //partially occluded

			//do not draw over existing canvas content
			if (occluded)
				destCtx.globalCompositeOperation = "destination-over";


			//render particle
			destCtx.fillStyle = p.color;
			if (size > Particle.IMAGE_SIZE) {
				//support particles bigger than Particle.IMAGE_SIZE
				const img = Particle.image[Particle.IMAGE_SIZE];
				destCtx.drawImage(
					img,
					Math.round(x1 * cx + cx - size/2),
					Math.round(y1 * cy + cy - size/2),
					Math.round(size), Math.round(size));
			}
			else {
				//faster for particles that are <= Particle.IMAGE_SIZE
				const img = Particle.image[Math.min(Particle.IMAGE_SIZE, Math.round(size))];
				destCtx.drawImage(
					img,
					Math.round(x1 * cx + cx - size/2),
					Math.round(y1 * cy + cy - size/2));
			}

			//reset blend mode
			if (occluded)
				destCtx.globalCompositeOperation = "source-over";
		}
	}
}
Particle.IMAGE_SIZE = 12;
Particle.init();
