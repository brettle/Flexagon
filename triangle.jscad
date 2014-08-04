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
    },
    {
      name: 'outlineWidth',
      type: 'float',
      initial: 1,
      caption: 'Width of the outline (mm):'
    },
    {
      name: 'flip',
      type: 'choice',
      values: ['Yes', 'No'],
      initial: 'No',
      caption: 'Display it groove side up?:'
    }    
    ];
}

function main(params) {
  var triangle = tri(params);
  if (params.flip == 'Yes') {
    triangle = triangle
      .translate([0,0,-(params.bandWidth+2.0*params.ridgeThickness)])
      .scale([1,1,-1]);
  }
  return triangle;
}

function tri(params) {
  return union(
      tri3rd(params), 
      tri3rd(params).rotateZ(120), 
      tri3rd(params).rotateZ(-120))
    .subtract(union(
      carve3rd(params),
      carve3rd(params).rotateZ(120), 
      carve3rd(params).rotateZ(-120)))
;
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
  var slot_cyl_radius = params.distanceBetweenGrooves/2.0 + 
    2.0*params.grooveDepth;
  var groove_cyl_radius = params.distanceBetweenGrooves/2.0 + params.grooveDepth;
  var barrier_cyl_radius = params.distanceBetweenGrooves/2.0;
  var hollow_cyl_radius = barrier_cyl_radius - params.outlineWidth;
  var res = 16;
  var slot_cyl = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, params.ridgeThickness + params.bandWidth],
    radiusStart: slot_cyl_radius,
    radiusEnd: barrier_cyl_radius,
    resolution: res
    });
  var groove_cyl = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, params.ridgeThickness],
    radius: groove_cyl_radius,
    resolution: res
    });
  var barrier_cyl = CSG.cylinder({
    start: [0, 0, params.ridgeThickness],
    end: [0, 0, params.ridgeThickness + params.bandWidth],
    radius: barrier_cyl_radius,
    resolution: res
    });
  var corner_x = -params.sideLength / 2.0;
  var corner_y = corner_x / tan(60);

  var tabs_cyl_radius = params.sideLength/2.0-2.0*params.outlineWidth;
  var tabs_cyl = CSG.cylinder({
    start: [0, 0, params.ridgeThickness],
    end: [0, 0, params.ridgeThickness + params.bandWidth],
    radiusStart: tabs_cyl_radius,
    radiusEnd: tabs_cyl_radius - 2 * params.grooveDepth,
    resolution: res
    });
  tabs_cyl = tabs_cyl.subtract(CSG.cylinder({
    start: [0, 0, params.ridgeThickness],
    end: [0, 0, params.ridgeThickness + params.bandWidth],
    radius: tabs_cyl_radius - 2 * params.grooveDepth,
    resolution: res
    }))
    .intersect(tri3rd(params).translate([0, -corner_y, 0]));
  var hollow_cyl = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, 2*params.ridgeThickness + params.bandWidth],
    radius: hollow_cyl_radius,
    resolution: res
    });
  return union(slot_cyl.subtract(groove_cyl).subtract(barrier_cyl),
    tabs_cyl,
    hollow_cyl)
    .translate([0, corner_y, 0]);
}

function tri3rd(params) {
  var x = params.sideLength / 2.0;
  var y = x / tan(60);
  var bottom_CAG = new CSG.Path2D([[x,-y], [-x,-y], [0,0]], true)
    .innerToCAG();
  var thickness = 2*params.ridgeThickness+params.bandWidth;
  var solid_3rd = bottom_CAG.extrude({offset: [0, 0, thickness]});
  var s = 1.0*(y-params.outlineWidth)/y;
  var hollow_3rd = solid_3rd.subtract(solid_3rd.scale([s, s, 1.0]));
  var solid_cyl_radius 
    = params.distanceBetweenGrooves/2.0 + 
      2.0*params.grooveDepth + params.outlineWidth;
  var solid_cyl = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, thickness],
    radius: solid_cyl_radius,
    resolution: 16
    }).translate([0, -y, 0]).intersect(solid_3rd);
  var connecting_tri = CSG.cylinder({
    start: [0, 0, 0],
    end: [0, 0, thickness],
    radius: y,
    resolution: 3
    }).rotateZ(-90);
  var d = y * sin(30); /* distance to side of connecting tri */
  s =  1.0*(d-params.outlineWidth)/d;
  var connecting_tri_hollow
    = connecting_tri
      .subtract(connecting_tri.scale([s, s, 1.0]))
      .intersect(solid_3rd);
  return hollow_3rd.union(solid_cyl).union(connecting_tri_hollow);
}



