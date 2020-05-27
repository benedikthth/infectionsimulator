class Vector { 
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    
    add(other){
        return new Vector(this.x + other.x, this.y+other.y)
    }
    
    distance(other){
        return Math.sqrt(Math.pow(this.x-other.x,2)+Math.pow(this.y-other.y,2))
    }

    mult(other){ 
        return new Vector(this.x*other.x, this.y*other.y)
    }
    div(other){
        return new Vector(this.x/other.x, this.y/other.y)
    }
    normalize(){ 
        let len = Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y,2) )
        this.x = this.x/len
        this.y = this.y/len
    }
}

function norm(x, muy, sigma){
    // let sigma = 1; let mean = 0;
    let t = ( 1 / ( Math.sqrt( 2*Math.PI*(sigma*sigma) )))
    let e = ( (-Math.pow(x-muy, 2)/ 2*sigma*sigma ))

    return (t * Math.pow(Math.E,e) )
}

class D1Noise { 
    constructor(offset){
        this.offset = offset;
    }
    reseed(offset){
        this.offset = offset;
    }
    get(x){ 
        return Math.sin (0.1 * (x+this.offset)) + Math.sin(Math.PI * (x+this.offset) )
    }
}
function getInInterval(interval){
    var max = interval[1]
    var min = interval[0]
    var d = max - min; 
    return min + (Math.random() * d)
}

diseaseStateDescriptions = ['Uninfected', 'Asymptomatic', 'Symptomatic', 'Very Sick', 'Dead', 'Recovered']
baseDiseaseStateLengths = [[-1, -1], [1, 14], [1,8], [1,3], [-1, -1], [-1, -1]]
diseaseStatusColors = ['black', 'orange', 'red', 'black', 'purple', 'green']


class Disease {
    diseaseState = 0;
    diseasePath = [0, 1];
    diseaseStateLengths = [-1, getInInterval(baseDiseaseStateLengths[1])];
    t = 0; 

    isInfectious(){
        let state = this.getDiseaseState()
        return state == 1 || state == 2 || state == 3
    }

    canBeInfected(){
        return this.getDiseaseState() == 0;
    }
    setImmune(){
        this.diseasePath = [0, 1, 5];
        this.diseaseState = 2; 
    }

    setInfected(){
        this.diseaseState = 1;
        this.t = 0;
        // console.log('setting disease infected');
        // console.log(this.diseasePath);
        
    }

    update( delta ){
        // console.log(this.diseaseState, this.t);
        
        let s = this.getDiseaseState()
        if(s == 0) { return; }
        if(s == 5) { return; }
        if(s == 4) { return; }
        
        this.t += delta;
        if(this.t >= this.diseaseStateLengths[this.diseaseState]){
            // console.log("updating disease state");
            
            this.diseaseState += 1;
            this.t = 0; 
        }
    }

    getDiseaseState(){
        return this.diseasePath[this.diseaseState]
    }

    constructor(){ 
        // this.diseaseState = i;
        if(Math.random() < 0.5){
            // this patient will become symptomatic.
            this.diseasePath.push(2);
            this.diseaseStateLengths.push(getInInterval(baseDiseaseStateLengths[2]))
            if(Math.random() < 0.5){
                // this person will become real sick
                this.diseasePath.push(3)
                this.diseaseStateLengths.push(getInInterval(baseDiseaseStateLengths[3]))
                if(Math.random() < 0.5){
                    // this peson will die
                    this.diseasePath.push(4)
                    return;
                } 
            } 
        }
        this.diseasePath.push(5)
    }
}

console.log(new Disease())

class Person {
    
    t = 0;

    position = null; 
    
    wearingMask = false;
    xNoise = new D1Noise(Math.random()*100);
    yNoise = new D1Noise(Math.random()*100);
    ctx = null;
    bounds = null;
    speed = 1;

    isInfectious(){
        return this.disease.isInfectious()
    }
    canBeInfected(){
        return this.disease.canBeInfected()
    }
    infect(){ 
        this.disease.setInfected()
    }
    setImmune(){
        this.disease.setImmune()
    }

    isImmune(){
        return this.disease.getDiseaseState() == 5;
    }

    constructor(xMax, yMax, ctx){
        this.position = new Vector(Math.random()*xMax, Math.random()*yMax);
        this.ctx = ctx;
        this.bounds = new Vector(xMax, yMax)
        // this.infected = (Math.random() < 0.1)
        this.wearingMask = (Math.random() < 0.8)
        this.disease = new Disease()
        if(Math.random() <  0){
            this.disease.setInfected()
        }
    }

    probabilityOfTransmission(other){
        let distance = this.position.distance(other.position);
        // let distanceMultiplier = norm(distance, 0, 8)
        
        if(!this.disease.isInfectious()){ return 0; }
        
        if(this.wearingMask && other.wearingMask){ return 0.015;}
        if(this.wearingMask && !other.wearingMask){ return 0.05;}
        if(!this.wearingMask && other.wearingMask){ return 0.7;}
        if(!this.wearingMask && !other.wearingMask){ return 1;}

        return distanceMultiplier
    }

    correctPosition(){
        let border = 5;
        let xb = this.bounds.x - border;
        let yb = this.bounds.y - border; 
        this.position.x = (this.position.x < border)? border: this.position.x;
        this.position.x = (this.position.x > xb)? xb: this.position.x;
        this.position.y = (this.position.y < border)? border: this.position.y;
        this.position.y = (this.position.y > yb)? yb: this.position.y;
    }

    getDiseaseState(){
        return this.disease.getDiseaseState()
    }

    draw(direction){
        this.ctx.save()
        let angle = Math.atan2(direction.y,direction.x)
        // angle = angle * Math.PI / 180
        // console.log(angle);
        
        let dstate = this.disease.getDiseaseState()//.diseasePath[this.disease.diseaseState]
        this.ctx.fillStyle = diseaseStatusColors[dstate]
        // this.ctx.fillText(dstate, this.position.x-1, this.position.y-1)
        this.ctx.fillRect(this.position.x-1, this.position.y-1, 2, 2)
        if(this.wearingMask){
            this.ctx.beginPath()
            // this.ctx.move/To(this.position.x, this.position.y);

            this.ctx.arc(this.position.x, this.position.y, 3, angle-1, angle+1)
            this.ctx.stroke()
        }
        this.ctx.restore()
    }

    update(delta){
        
        if(this.disease.getDiseaseState() == 4){
            this.draw(new Vector(1, 1)) 
            return;
        }
        this.disease.update(delta)
        // console.log(delta);
        if(Math.random() < 0.05){
            this.xNoise.reseed(Math.random()*1000)
            this.yNoise.reseed(Math.random()*1000)
        }
        
        this.t += (delta/1000);
        // console.log(this.t);
        
        let direction = new Vector(this.xNoise.get(this.t), this.yNoise.get(this.t))        
        // console.log(direction);
        direction.normalize()
        direction = direction.mult(new Vector(this.speed, this.speed))
        // console.log(direction);
        
        this.position = this.position.add(direction)
        this.correctPosition()

        // let worldPos = this.position.mult(this.bounds)
        // console.log(worldPos);
        this.draw(direction)
        // this.ctx.fillRect(this.position.x-1, this.position.y-1, 2, 2)
        

    }

}