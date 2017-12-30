class Planets {
	static init() {
		Planets.canvas = document.querySelector("#display");
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

		Planets.current = new Planet(0x42069, {
			"size": 0.7,
			"water": 0.6,
			"atmoDensity": 0.5
		});
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
		
		planet.render(cam, Planets.bufData);

		createImageBitmap(Planets.bufData).then(bmp => {
			const canvas = Planets.canvas;
			Planets.bctx.clearRect(0, 0, w, h);
			Planets.bctx.drawImage(bmp, 0, 0);
			bmp.close();

			Particle.renderAll(planet, cam, planet.clouds, Planets.bctx);
			
			Planets.ctx.clearRect(0, 0, canvas.width, canvas.height);
			Planets.ctx.drawImage(Planets.buffer, 0, 0, canvas.width, canvas.height);
			requestAnimationFrame(Planets.update);
		});
	}
}
Planets.RENDER_W = 150;
Planets.RENDER_H = 150;

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

window.onload = (event) => Planets.init();