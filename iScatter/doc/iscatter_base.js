/*
//Would it make sense to make use of something like datapackage.json to define the schema?
var CONFIG['C_SCHEMA']='../data/students_schema.csv'


var CONFIG['C_DATA']='../data/students_data.csv'
var CONFIG['C_NAME']='Cat herding 102'
var CONFIG['C_DESC']='Fictitious student cohort data of a fictitious module. Students are heads of academic departments. YY'

//Optional ID for chart block element
var CONFIG['C_CHARTID']='class' //default is 'iScatterChart'

//To what extent can we automatically estimate these, or derive sensible defaults from schema?
var CONFIG['C_XATTR']=['script','student','oes']
var CONFIG['C_YATTR']=['script','student','ocas']

var CONFIG['C_XINIT']='ocas'
var CONFIG['C_YINIT']='oes'
var CONFIG['C_AINIT']='age'

//Can we automagically guess these or derive sensible defaults from schema?
var CONFIG['C_STATS']= {'ocas':['mode', 'mean', 'stddev', 'range'], 'oes':['mode', 'mean', 'stddev', 'range'] }

var CONFIG['C_REFERENCES'] = {'ocas':['Distinction', 'Merit', 'Pass'], 'oes':['Distinction', 'Merit', 'Pass'] }

//Can we automagically guess these or derive sensible defaults from schema?
var CONFIG['C_SUBSETS']= ['tutor', 'gender', 'ethnic', 'marker']

//Can we automagically guess these from schema?
var CONFIG['C_INTVARS']=['oes', 'ocas', 'age']
//*/

//-----------------------------
// The code to create the scatterplot and put it into the SVG element

// First create the data schema
var chartSchema = new Schema(CONFIG['C_SCHEMA']);

// Next create and load the dataset
var chartData = new Dataset(chartSchema)
		.addTuples(CONFIG['C_DATA']);

// Name and describe the dataset (this will appear as chart title and its tooltip)
chartData.name(CONFIG['C_NAME'])
		.description(CONFIG['C_DESC']);

// Create the chart at the SVG element with the given id
//Enable a default?
var chartID=(CONFIG['C_CHARTID']=='') ? 'iScatterChart' : CONFIG['C_CHARTID']
var chartCtrl = new Controller(chartData, chartID);

// Now we configure the schema (which defines the attributes)
var chartAttr = chartSchema.attributes(); 	// get all the attributes; used later

// age and scores are integers, so their statistics should only have one decimal place 
//Can't this be handled from the schema?
//how do we iterate through values and display the type?
//This really needs setting automagically from schema and maybe type detection?
//chartSchema.attribute('oes').decimals(1);
//chartSchema.attribute('ocas').decimals(1);
//chartSchema.attribute('age').decimals(1);
for (var tmp_attr in CONFIG['C_INTVARS']) 
  chartSchema.attribute(tmp_attr)


// Next we configure the chart view
var chartView = chartCtrl.view();

// by default, any attribute can be seen on any axis
// for this dataset, it's pointless to have individual scripts and students on any axis
// moreover, we don't want class scores in the x axis and no assignment scores in y
//what does "difference" mean? Can we by default pass in all columns, or a declared list?
chartView.attributes('x', chartAttr.difference(CONFIG['C_XATTR']));
chartView.attributes('y', chartAttr.difference(CONFIG['C_YATTR']));

// set the initial attributes shown in the x and y axes and as circle area (bubble chart)
//Scales: 'ord','log','lin'
if (CONFIG['C_XINIT']!='') {
	chartView.attribute('x', CONFIG['C_XINIT']);
	if (CONFIG['C_XSCALE']!='') {
		if (CONFIG['C_XSCALE']=='lin') chartView.scale(CONFIG['C_XINIT'], 1)
		else chartView.scale(CONFIG['C_XINIT'], CONFIG['C_XSCALE'])
	}
}
if (CONFIG['C_YINIT']!='') {
	chartView.attribute('y', CONFIG['C_YINIT']);
	if (CONFIG['C_YSCALE']!='') {
		if (CONFIG['C_YSCALE']=='lin') chartView.scale(CONFIG['C_YINIT'], 1)
		else chartView.scale(CONFIG['C_YINIT'], CONFIG['C_YSCALE'])
	}
}
if (CONFIG['C_AINIT']!='') chartView.attribute('a', CONFIG['C_AINIT']);


//HACK
if (CONFIG['C_YRANGE']!='') chartView.domain(CONFIG['C_YINIT'],CONFIG['C_YRANGE'])
//END HACK

// increase the circle size and reference line width to make it easier to hover on them
chartView.size('circle', 5).size('line', 3);
// increase margins to fit the legend labels and axis titles, even when web page enlarged
chartView.size('left', 80).size('right', 100).size('bottom', 55);

// by default, all statistics for the attribute's measurement level are available
// for the scores, we only want to see the most relevant statistics

//?so can chartView.statistics just accept a single parameter?
//need to handle the default better?
//chartView.statistics('ocas', stats );
//chartView.statistics('oes',  stats );
for (var tmp_attr in CONFIG['C_STATS']) 
  chartView.statistics(tmp_attr, CONFIG['C_STATS'][tmp_attr] )

// Next we configure the controller

// by default, each attribute has reference lines "Benchmark 1 and "Benchmark 2"
// change the reference lines for the class and assignments scores
//chartCtrl.references('ocas',['Distinction', 'Merit', 'Pass'] );
//chartCtrl.references('oes', ['Distinction', 'Merit', 'Pass']);
for (var tmp_attr in CONFIG['C_REFERENCES']) 
  chartCtrl.references(tmp_attr, CONFIG['C_REFERENCES'][tmp_attr])
  
// pre-compute the subsets of all different values of three attributes
//so what's the semantics of this then? 
//this looks like mapping for nominal vars except script. BY default generate for nominal vars?
//then exclude or include in exemptions?
//chartCtrl.addSubsets('tutor');	// create a subset of students for each tutor
//chartCtrl.addSubsets('gender');	// create the subsets of male and female students
//chartCtrl.addSubsets('ethnic');	// create a subset of students for each ethnicity
//chartCtrl.addSubsets('marker');	// create a subset of students per marker
for (var i = 0; i < CONFIG['C_SUBSETS'].length; i++){ 
    chartCtrl.addSubsets(CONFIG['C_SUBSETS'][i])
    //if (CONFIG['C_COLOURGROUP']==CONFIG['C_SUBSETS'][i]) 
    //  chartCtrl.showSubsets(CONFIG['C_COLOURGROUP'], true)
    chartCtrl.showSubsets(CONFIG['C_SUBSETS'][i], true)
}



/*  
// reset the chart: show all points, with same size, and clear the legend
function reset() {
	chartView.zoom()						// auto-zoom to make all points visible
			.size('circle', 5)			// make circles easily visible
			.attribute('a', '');		// no attribute for the circle area 
	chartCtrl.showSubsets('', false);	// hide all subsets (except chosen)
}


// chart to see gender score averages
function gender() {
	reset();								// leave only 1 subset ("chosen") in legend
	chartCtrl.showSubsets('gender', true);	// add female/male as 2nd/3rd subsets
	chartView.attribute('x', 'ocas')			// show OCAS on x axis
			.scale('ocas', 1)				// with a linear scale
			.attribute('y', 'oes')			// show OES on y axis
			.scale('oes', 1)				// with a linear scale
			.reference(chartView.subset(2), 'oes', 'mean')	// show 2nd subset's OES mean
			.reference(chartView.subset(2), 'ocas', 'mean')	// same for OCAS mean
			.reference(chartView.subset(3), 'oes', 'mean')	// same for 3rd subset
			.reference(chartView.subset(3), 'ocas', 'mean');
}

function groups() {
	reset(); 
	chartCtrl.showSubsets('tutor', true);	// show the 2 tutor groups in legend
	chartView.attribute('x', 'ethnic')		// ethnic origin in x axis
			.attribute('y', 'gender');		// gender in y axis
}

function markers() {
	reset(); 
	chartCtrl.showSubsets('tutor', true)		// show tutor groups in 2nd + 3rd position
			.showSubsets('marker', true);	// followed by the 3 markers
	chartView.attribute('x', 'marker')
			.attribute('y', 'oes')
			// show OES median for each marker
			.reference(chartView.subset(4), 'oes', 'median')
			.reference(chartView.subset(5), 'oes', 'median')
			.reference(chartView.subset(6), 'oes', 'median');
*/