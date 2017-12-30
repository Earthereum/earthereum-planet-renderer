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
		gui.add(traits, "size", 0, 1).onChange(update).listen();
		gui.add(traits, "water", 0, 1).onChange(update).listen();
		gui.add(traits, "atmoDensity", 0, 1).onChange(update).listen();
		gui.add(traits, "cloudDensity", 0, 1).onChange(update).listen();
		gui.addColor(traits, "baseColor").onChange(update).listen();
		gui.addColor(traits, "accColor").onChange(update).listen();
		gui.add(traits, "numTerrains", 2, 8, 1).onChange(update).listen();

		gui.add({"random": () => {
			traits.size = Math.random() * 0.7 + 0.3;
			traits.water = Math.random();
			traits.atmoDensity = Math.random();
			traits.cloudDensity = Math.random();
			// traits.baseColor = chroma.random().hex();
			// traits.accColor = chroma.random().hex();
			traits.numTerrains = Math.round(Math.random()*6)+2;
			update();
		}}, "random");

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
	"water": 0.5,
	"atmoDensity": 0.5,
	"cloudDensity": 0.5,
	"baseColor": 0xa4be92,
	"accColor": 0xf5dac3,
	"numTerrains": 4
};

window.onload = (event) => Planets.init();