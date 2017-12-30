class Planets {
	static init() {
		//prepare display canvas
		Planets.canvas = document.querySelector("#display");
		Planets.canvas.width = 450;
		Planets.canvas.height = 450;
		Planets.ctx = Planets.canvas.getContext("2d");
		Planets.ctx.imageSmoothingEnabled = false;

		//create buffer canvas
		Planets.buffer = document.createElement("canvas");
		Planets.buffer.width = Planets.RENDER_W;
		Planets.buffer.height = Planets.RENDER_H;
		Planets.bctx = Planets.buffer.getContext("2d");

		//create an imagedata for rendering the planet terrain
		Planets.bufData = new ImageData(Planets.RENDER_W, Planets.RENDER_H);

		//attach orbit controls to the display canvas
		Planets.orbitControls = new OrbitControls(Planets.canvas);

		//create a demo planet
		Planets.current = new Planet(0x42069, Planets.traits);

		Planets.makeGUI();

		//schedule the first update
		requestAnimationFrame(Planets.update);
	}

	static makeGUI() {
		const traits = Planets.traits;
		let gui = new dat.gui.GUI();
		const update = () => Planets.current.rebuild();

		gui.remember(traits);
		gui.add(traits, "size", 0, 1).onChange(update);
		gui.add(traits, "water", 0, 1).onChange(update);
		gui.add(traits, "atmoDensity", 0, 1).onChange(update);
		gui.add(traits, "cloudDensity", 0, 1).onChange(update);

		Planets.gui = gui;
	}

	/**
	 * Renders the current planet.
	 */
	static update() {
		const planet = Planets.current;
		const w = Planets.RENDER_W;
		const h = Planets.RENDER_H;

		Planets.orbitControls.update();

		//compute camera rotation as a function of time and the orbit controls
		const time = Date.now()/1000;
		const rotX = Planets.orbitControls.rotX;
		const rotY = time*0.4 + Planets.orbitControls.rotY;
		const rotZ = 0;

		//package the camera parameters into an object
		const cam = {w, h, rotX, rotY, rotZ};
		
		//render the planet terrain (surface)
		planet.render(cam, Planets.bufData);

		createImageBitmap(Planets.bufData).then(bmp => {
			const canvas = Planets.canvas;
			
			//draw the terrain to the buffer canvas
			Planets.bctx.clearRect(0, 0, w, h);
			Planets.bctx.drawImage(bmp, 0, 0);
			bmp.close(); //free resources

			//render particles onto the buffer canvas
			Particle.renderAll(planet, cam, planet.clouds, Planets.bctx);
			
			//scale and copy the buffer onto the display canvas
			Planets.ctx.clearRect(0, 0, canvas.width, canvas.height);
			Planets.ctx.drawImage(Planets.buffer, 0, 0, canvas.width, canvas.height);
			requestAnimationFrame(Planets.update);
		});
	}
}
Planets.RENDER_W = 150;
Planets.RENDER_H = 150;
Planets.traits = { //default traits
	"size": 0.7,
	"water": 0.6,
	"atmoDensity": 0.5,
	"cloudDensity": 0.5
};

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