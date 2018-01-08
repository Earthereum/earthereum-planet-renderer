export const fsin = x => {
	//mod 2pi
	x*=0.159155;
	x-=~~x;

	//black magic
	const xx=x*x;
	let y=-6.87897;
	y=y*xx+33.7755;
	y=y*xx-72.5257;
	y=y*xx+80.5874;
	y=y*xx-41.2408;
	y=y*xx+6.28077;
	return x*y;
};
export const fcos = x => fsin(x+1.5708);