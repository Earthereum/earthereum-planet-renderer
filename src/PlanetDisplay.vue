<template>
<canvas ref="display"></canvas>
</template>

<script>
import Planet from "./Planet.js";
import OrbitControls from "./OrbitControls.js";
import Particle from "./Particle.js";
import Noise from "./Noise.js";

export {Planet, OrbitControls, Particle, Noise};

export default {
	props: {
		"planet": {
			default: null
		}, 
		"resolution-x": {
			type: Number,
			default: 150
		}, 
		"resolution-y": {
			type: Number,
			default: 150
		},
		"paused": {
			type: Boolean,
			default: false
		},
		"interactive": {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {}
	},
	mounted() {
		this.init();
	},
	methods: {
		init() {
			//prepare display canvas
			const canvas = this.$refs.display;
			canvas.width = this.$el.offsetWidth;
			canvas.height = this.$el.offsetHeight;
			this.ctx = canvas.getContext("2d");
			this.ctx.imageSmoothingEnabled = false;

			//create buffer canvas
			this.buffer = document.createElement("canvas");
			const buffer = this.buffer;
			buffer.width = this.resolutionX;
			buffer.height = this.resolutionY;
			this.bctx = buffer.getContext("2d");
			this.bctx.imageSmoothingEnabled = false;

			this.haloBuffer = document.createElement("canvas");
			const haloBuffer = this.haloBuffer;
			haloBuffer.width = this.resolutionX;
			haloBuffer.height = this.resolutionY;

			//create image buffer for planet terrain
			this.terrainData = new ImageData(this.resolutionX, this.resolutionY);

			//attach orbit controls to the display canvas
			if (this.interactive)
				this.orbitControls = new OrbitControls(canvas);
			else
				this.orbitControls = {update: () => {}, rotX: 0, rotY: 0};

			//render at least once
			requestAnimationFrame(() => this.update());
		},

		scheduleUpdate() {
			if (this.paused)
				requestAnimationFrame(() => this.scheduleUpdate());
			else
				requestAnimationFrame(() => this.update());
		},

		update() {
			const planet = this.planet;
			const w = this.resolutionX;
			const h = this.resolutionY;

			this.orbitControls.update();

			//compute camera rotation as a function of time and the orbit controls
			const time = Date.now()/1000;
			const rotX = this.orbitControls.rotX;
			const rotY = time*0.4 + this.orbitControls.rotY;
			const rotZ = 0;

			//package the camera parameters into an object
			const cam = {w, h, rotX, rotY, rotZ};
			
			//render the planet terrain (surface)
			planet.render(cam, this.terrainData, this.haloBuffer);

			createImageBitmap(this.terrainData).then(bmp => {
				const canvas = this.$refs.display;
				
				//draw the terrain to the buffer canvas
				this.bctx.clearRect(0, 0, w, h);
				this.bctx.drawImage(bmp, 0, 0);
				bmp.close(); //free resources

				//render particles onto the buffer canvas
				Particle.renderAll(planet, cam, planet.clouds, this.bctx);

				this.bctx.globalCompositeOperation = "lighter";
				this.bctx.drawImage(this.haloBuffer, 0, 0);
				this.bctx.globalCompositeOperation = "source-over";

				//scale and copy the buffer onto the display canvas
				this.ctx.clearRect(0, 0, canvas.width, canvas.height);
				this.ctx.drawImage(this.buffer, 0, 0, canvas.width, canvas.height);
				
				this.scheduleUpdate();
			});
		}
	}
}
</script>