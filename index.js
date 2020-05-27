/**
 * Do a 'rona sim bud.
 */
var peopleNumber = 2000; 
var infectionDistance = 10;


var mainCanvas = document.getElementById('mainCanvas').getContext('2d');
var secondaryCanvas = document.getElementById('infections').getContext('2d');

maxY = mainCanvas.canvas.height
maxX = mainCanvas.canvas.width



// resolution = maxY/maxX;

var people = []

for(var i = 0; i < peopleNumber; i ++){
    var newPerson = new Person(maxX, maxY, mainCanvas);
    if(Math.random() < 0.6){
        newPerson.setImmune();   
    }
    people.push(newPerson)
}

let delta = 0;

function drawLine(ctx, vector1, vector2, alpha=255){
    // console.log(vector2)
    ctx.save() 
    a = alpha.toString(16)
    ctx.strokeStyle = `#000000${a}`
    ctx.beginPath()
    ctx.moveTo(vector1.x, vector1.y)
    ctx.lineTo(vector2.x, vector2.y)
    ctx.closePath()
    ctx.stroke()
}

let timeseries = {
    infecteds: [],
    // asymptomatics: [], 
    criticals: [],
    dead: [],
    immune: [],
    vulnerable: [],
}

let timeSeriesColors = {
    infecteds: 'black',
    // asymptomatics: 'orange', 
    criticals: 'red',
    dead: 'purple',
    immune: 'green',
    vulnerable: 'orange'
}

function loop(lastiter){
    time = Date.now()
    delta = time - lastiter;
    delta = delta / 1000 // ms per frame
    fps = 1/delta 

    mainCanvas.clearRect(0, 0, 1000, 1000)
    mainCanvas.strokeRect(0, 0,30,15)
    mainCanvas.fillText(Math.round(fps*2)/2, 6, 10)

    // mainCanvas.fillText(Math.rounsd(resolution*5)/5, 20, 20)

    infecteds = people.filter(x=>x.isInfectious())
    healthys = people.filter(x=> x.canBeInfected())

    timeseries.vulnerable.push(healthys.length)


    for(var i = 0; i < infecteds.length; i++){
        var inf = infecteds[i]
        for(var j = 0; j < healthys.length; j++ ){
            let hea = healthys[j];
            dist = inf.position.distance(hea.position);
            if(dist <= infectionDistance) {
                lerp = 1- (dist / infectionDistance)
                lerp = Math.round(lerp * 255);
                drawLine(mainCanvas, inf.position, hea.position, lerp)
                infectionProb = inf.probabilityOfTransmission(hea);

                if(Math.random() < infectionProb){
                    hea.infect()
                }
                
            }

        }

    }


    for(var i = 0; i < people.length; i ++){
        person = people[i];
        person.update(delta)
    }

    num_infected = people.filter(x=>x.isInfectious()).length
    num_critical = people.filter(x=>x.getDiseaseState() == 3).length
    num_dead = people.filter(x=>x.getDiseaseState() == 4).length
    num_immune = people.filter(x=>x.isImmune() ).length


    timeseries.infecteds.push(num_infected);
    timeseries.immune.push(num_immune); 
    timeseries.criticals.push(num_critical);
    timeseries.dead.push(num_dead);

    drawGraphs()

    requestAnimationFrame(loop.bind(null, time))


}
loop(Date.now())



function drawGraphs(){
    
    let ctx = secondaryCanvas
    let height = secondaryCanvas.canvas.height;
    let width = secondaryCanvas.canvas.width;
    ctx.clearRect(0, 0, width, height)


    let keys = Object.keys(timeseries)
    
    let maxes = []
    for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        maxes.push(Math.max(0, (Math.max.apply(null, timeseries[key]))))
    }

    max = Math.max.apply(null, maxes);

    step = width/timeseries[keys[0]].length

    for(var k = 0; k < keys.length; k++){
        key=keys[k]
        ctx.save()
        ctx.strokeStyle = timeSeriesColors[key]
        ts = timeseries[key]
        ts = ts.map(x=>height-(x/max*height))
        ctx.beginPath()
        ctx.moveTo(0, ts[0])

        for (let i= 0; i< ts.length; i++) {
            const y = ts[i];
            ctx.lineTo(i*step, y);
            // ctx.moveTo(i*step, y);
        }
        ctx.stroke()
        ctx.closePath()
        ctx.fillText(`max ${key}: ${maxes[k]}`, 10, 10+10*k)

        ctx.restore()
    }

}

document.getElementById('mainCanvas').onmousedown = (ev) => {
    let x = new Person(maxX, maxY, mainCanvas);
    x.position=new Vector(ev.x, ev.y);
    x.infect();
    people.push(x)
}