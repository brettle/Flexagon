function getParameterDefinitions() {
	return [
		{
			name: 'sideLength',
			type: 'float',
			initial: 104.0,
			caption: 'Length of side of triangle (mm):'
		},
		{
			name: 'ridgeThickness',
			type: 'float',
			initial: 0.2,
			caption: 'Groove side thickness (mm):'
		},
		{
			name: 'grooveDepth',
			type: 'float',
			initial: 2,
			caption: 'Groove depth (mm):'
		},
		{
			name: 'distanceBetweenGrooves',
			type: 'float',
			initial: 35,
			caption: 'Distance between the grooves on the triangle side (mm):'
		},
		{
			name: 'bandWidth',
			type: 'float',
			initial: 1,
			caption: 'Width of the stretched rubber band (mm):'
		}

		];
}

function main(params) {
	return tri(params)
/*
		.translate([0,0,-(params.bandWidth+2.0*params.ridgeThickness)])
		.scale([1,1,-1])
*/
;
}

function tri(params) {
	return union(
			tri3rd(params), 
			tri3rd(params).rotateZ(120), 
			tri3rd(params).rotateZ(-120))
		.subtract(union(
			carve3rd(params),
			carve3rd(params).rotateZ(120), 
			carve3rd(params).rotateZ(-120)));
}

function carve3rd(params) {
	/* Carve out a semi-circular groove for the rubber band, centered on the
	   edge of the triangle. */
	/* To make the groove, we make three cylindrical solids. The first
     is the slot cylinder and actually carves through one side of the
     triangle so that the rubber band will go into the groove. We call this
     the slot cylinder. */
  /* However, we don't want to carve the slot cylinder out of our
     triangle. Only an outline that is wide enough for the rubber band should 
     carve that deep. So we slice a smaller groove cylinder off the side of the
     slot cylinder first, and an even smaller barrier cylinder out of the entire
     cylinder so that we get a groove outline which we actually want to carve. */
	var slot_cyl_radius = params.distanceBetweenGrooves/2.0
		+ params.grooveDepth + params.bandWidth;
	var groove_cyl_radius = params.distanceBetweenGrooves/2.0 + params.grooveDepth;
	var barrier_cyl_radius = params.distanceBetweenGrooves/2.0;
  var slot_cyl = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, params.ridgeThickness + params.bandWidth],
    radiusStart: slot_cyl_radius,
    radiusEnd: slot_cyl_radius - (params.ridgeThickness + params.bandWidth)
    });
  var groove_cyl = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, params.ridgeThickness],
    radius: groove_cyl_radius
    });
  var barrier_cyl = CSG.cylinder({
    start: [0, 0, params.ridgeThickness],
    end: [0, 0, params.ridgeThickness + params.bandWidth],
    radius: barrier_cyl_radius
    });
	var corner_x = -params.sideLength / 2.0;
	var corner_y = corner_x / tan(60);
  return slot_cyl
		.subtract(groove_cyl)
		.subtract(barrier_cyl)
    .translate([0, corner_y, 0]);
}

function tri3rd(params) {
	var x = params.sideLength / 2.0;
	var y = x / tan(60);
	var bottomCAG = new CSG.Path2D([[x,-y], [-x,-y], [0,0]], true)
		.innerToCAG();
	var solid3rd = bottomCAG.extrude({offset: [0, 0, 2*params.ridgeThickness+params.bandWidth]});
	return solid3rd;
}



