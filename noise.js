class Noise {
	constructor(seed) {
		this.seed = seed;
		this.P = [];
		for (let i=0; i<=255; i++)
			this.P.push(i);
		this.shuffle(this.P);
		this.P = this.P.concat(this.P);
	}

	perlin3d(x, y, z) {
		const C = 78151.135
		x += C;
		y += C;
		z += C;

		//unit cube coordinates
		const X = x & 255,
			  Y = y & 255, 
			  Z = z & 255;

		//cube-relative coordinates
		x -= Math.floor(x);
		y -= Math.floor(y);
		z -= Math.floor(z);

		//compute fade curves
		const fade = Noise._fade;
		const u = fade(x), 
			  v = fade(y), 
			  w = fade(z);

		//hash coords of the cube corners
		const P = Noise.P;
		const A = P[X  ]+Y, AA = P[A]+Z, AB = P[A+1]+Z,
			  B = P[X+1]+Y, BA = P[B]+Z, BB = P[B+1]+Z;

		//gradient values
		const grad = Noise._grad;
		const g0 = grad(P[AA], x,  y,  z),
			  g1 = grad(P[BA], x-1,y,  z),
			  g2 = grad(P[AB], x,  y-1,z),
			  g3 = grad(P[BB], x-1,y-1,z),
			  g4 = grad(P[AA+1], x,  y,  z-1),
			  g5 = grad(P[BA+1], x-1,y,  z-1),
			  g6 = grad(P[AB+1], x,  y-1,z-1),
			  g7 = grad(P[BB+1], x-1,y-1,z-1);

		//blend gradients from each cube corner
		const lerp = Noise._lerp;
		return lerp(w, lerp(v, lerp(u, g0, g1), lerp(u, g2, g3)), 
			   lerp(v, lerp(u, g4, g5), lerp(u, g6, g7)));
	}

	/**
	 * A seedable 1D random noise function.
	 * Adapted from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
	 * @param n the seed (int); determines the output value
	 * @return a number in the range [0,1]
	 */
	rand(seed) {
		function Mash() {
			var n = 4022871197;
			return function(r) {
				for(var t, s, f, u = 0, e = 0.02519603282416938; u < r.length; u++)
				s = r.charCodeAt(u), f = (e * (n += s) - (n*e|0)),
				n = 4294967296 * ((t = f * (e*n|0)) - (t|0)) + (t|0);
				return (n|0) * 2.3283064365386963e-10;
			}
		}
		
		var m = Mash(), a = m(" "), b = m(" "), c = m(" "), x = 1, y;
		seed += this.seed;
		seed = seed.toString(), a -= m(seed), b -= m(seed), c -= m(seed);
		a < 0 && a++, b < 0 && b++, c < 0 && c++;
		
		var y = x * 2.3283064365386963e-10 + a * 2091639; a = b, b = c;
		return c = y - (x = y|0);
	}

	/**
	 * Shuffles an array in place using Fisher-Yates.
	 */
	shuffle(a) {
		for (let i=a.length; i>0;) {
			var idx = Math.floor(this.rand(i)*(i--));
			var temp = a[i];
			a[i] = a[idx];
			a[idx] = temp;
		}
		return a;
	}

	/**
	 * Perlin noise fade function.
	 * @param t
	 */
	static _fade(t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}

	/**
	 * Linear interpolation from a to b.
	 * @param t fraction
	 * @param a from
	 * @param b to
	 */
	static _lerp(t, a, b) {
		return a + t * (b - a);
	}

	/**
	 * Perlin noise gradient function.
	 */
	static _grad(hash, x, y, z) {
		const h = hash & 15;
		const u = h < 8 ? x : y;
		const v = h < 4 ? y : (h===12 || h===14 ? x : z);
		return ((h&1) === 0 ? u : -u) + ((h&2) === 0 ? v : -v);
	}
}

//precomputed randomness
Noise.P = [136,167,10,31,13,98,217,227,93,112,147,38,225,56,238,121,231,9,253,
		   92,18,119,181,246,31,0,232,27,193,34,191,121,8,135,60,189,109,24,71,
		   34,121,245,85,22,80,62,186,145,150,41,254,14,83,75,142,54,6,72,72,2,
		   147,90,199,216,99,72,148,100,57,15,64,4,176,244,206,161,1,79,150,49,
		   195,170,173,244,245,165,231,106,11,112,24,255,98,178,113,5,61,32,92,
		   65,175,245,8,72,106,162,42,69,19,166,128,243,42,20,186,227,195,166,
		   220,178,157,196,190,221,37,236,226,237,28,124,154,122,171,64,172,7,
		   28,215,102,212,197,116,30,90,167,128,178,89,107,30,143,25,84,13,127,
		   109,156,199,219,18,84,161,113,218,238,143,242,182,62,238,207,151,
		   143,208,75,183,19,40,149,62,30,217,183,226,38,32,140,118,68,91,154,
		   98,181,60,225,225,60,222,63,40,172,38,247,249,45,122,233,137,231,79,
		   100,251,31,107,91,147,93,181,58,66,150,203,32,197,183,28,180,135,73,
		   142,194,136,37,223,82,36,167,155,200,120,192,92,185,247,108,207,14,
		   127,194,124,168,236,128,172,192,218];
Noise.P = Noise.P.concat(Noise.P);