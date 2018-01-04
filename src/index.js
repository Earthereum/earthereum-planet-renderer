export default class PlanetRenderer {
	static init(canvas) {
		//prepare display canvas
		PlanetRenderer.canvas = canvas;
		PlanetRenderer.canvas.width = 450;
		PlanetRenderer.canvas.height = 450;
		PlanetRenderer.ctx = PlanetRenderer.canvas.getContext("2d");
		PlanetRenderer.ctx.imageSmoothingEnabled = false;

		//create buffer canvas
		PlanetRenderer.buffer = document.createElement("canvas");
		PlanetRenderer.buffer.width = PlanetRenderer.RENDER_W;
		PlanetRenderer.buffer.height = PlanetRenderer.RENDER_H;
		PlanetRenderer.bctx = PlanetRenderer.buffer.getContext("2d");
		PlanetRenderer.bctx.imageSmoothingEnabled = false;

		//create an imagedata for rendering the planet terrain
		PlanetRenderer.bufData = new ImageData(PlanetRenderer.RENDER_W, PlanetRenderer.RENDER_H);

		//attach orbit controls to the display canvas
		PlanetRenderer.orbitControls = new OrbitControls(PlanetRenderer.canvas);

		//create a demo planet
		PlanetRenderer.current = new Planet(PlanetRenderer.traits);

		PlanetRenderer.makeGUI();

		//schedule the first update
		requestAnimationFrame(PlanetRenderer.update);
	}

	static makeGUI() {
		const traits = PlanetRenderer.traits;
		let gui = new dat.gui.GUI();
		const update = () => PlanetRenderer.current.rebuild();

		gui.remember(traits);
		gui.add(traits, "seed", 0, 0xFFFFFFFF, 1).onChange(update).listen();
		gui.add(traits, "size", 0, 1).onChange(update).listen();
		gui.add(traits, "water", 0, 1).onChange(update).listen();
		gui.add(traits, "atmoDensity", 0, 1).onChange(update).listen();
		gui.add(traits, "cloudDensity", 0, 1).onChange(update).listen();
		gui.addColor(traits, "baseColor").onChange(update).listen();
		gui.addColor(traits, "accColor").onChange(update).listen();
		gui.add(traits, "numTerrains", 2, 8, 1).onChange(update).listen();

		gui.add({"random": () => {
			traits.seed = Math.floor(Math.random() * 0xFFFFFFFF);
			traits.size = Math.random() * 0.7 + 0.3;
			traits.water = Math.random();
			traits.atmoDensity = Math.random();
			traits.cloudDensity = Math.random();
			traits.baseColor = chroma.random().desaturate(1).css();
			traits.accColor = chroma.random().desaturate(1).css();
			traits.numTerrains = Math.round(Math.random()*6)+2;
			update();
		}}, "random");

		PlanetRenderer.gui = gui;
	}

	/**
	 * Renders the current planet.
	 */
	static update() {
		const planet = PlanetRenderer.current;
		const w = PlanetRenderer.RENDER_W;
		const h = PlanetRenderer.RENDER_H;

		PlanetRenderer.orbitControls.update();

		//compute camera rotation as a function of time and the orbit controls
		const time = Date.now()/1000;
		const rotX = PlanetRenderer.orbitControls.rotX;
		const rotY = time*0.4 + PlanetRenderer.orbitControls.rotY;
		const rotZ = 0;

		//package the camera parameters into an object
		const cam = {w, h, rotX, rotY, rotZ};
		
		//render the planet terrain (surface)
		planet.render(cam, PlanetRenderer.bufData);

		createImageBitmap(PlanetRenderer.bufData).then(bmp => {
			const canvas = PlanetRenderer.canvas;
			
			//draw the terrain to the buffer canvas
			PlanetRenderer.bctx.clearRect(0, 0, w, h);
			PlanetRenderer.bctx.drawImage(bmp, 0, 0);
			bmp.close(); //free resources

			//render particles onto the buffer canvas
			Particle.renderAll(planet, cam, planet.clouds, PlanetRenderer.bctx);

			PlanetRenderer.bctx.globalCompositeOperation = "lighter";
			PlanetRenderer.bctx.drawImage(planet.haloBuffer, 0, 0);
			PlanetRenderer.bctx.globalCompositeOperation = "source-over";

			//scale and copy the buffer onto the display canvas
			PlanetRenderer.ctx.clearRect(0, 0, canvas.width, canvas.height);
			PlanetRenderer.ctx.drawImage(PlanetRenderer.buffer, 0, 0, canvas.width, canvas.height);
			requestAnimationFrame(PlanetRenderer.update);
		});
	}
}
PlanetRenderer.RENDER_W = 150;
PlanetRenderer.RENDER_H = 150;
PlanetRenderer.traits = { //default traits
	"seed": 0x42069,
	"size": 0.7,
	"water": 0.5,
	"atmoDensity": 0.5,
	"cloudDensity": 0.5,
	"baseColor": 0xa4be92,
	"accColor": 0xf5dac3,
	"numTerrains": 4
};

PlanetRenderer.init(document.querySelector("#display"));