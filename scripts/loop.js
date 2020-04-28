/**
 * Main Loop
 *
 * Create loop with a callback
 */

class Loop {
  constructor(loopFunction = null) {
    if(!loopFunction) throw new Error("not a function");
    this.pause = false;
    this.play = true;
    this.loopFunction = loopFunction;
    this.Time = {
      last : 0,
      delta : 0,
      time : 0,
    }

    console.log("Creation Loop", this);
    window.requestAnimationFrame((timestamp) => { this.Loop(timestamp) });
  }

  /**
   *
   */
  Loop(timestamp) {
    this.Time.delta = (timestamp - this.Time.last) / 1000;
    this.Time.last = timestamp;
    this.Time.time += this.Time.delta;
    if(!this.pause){
      this.loopFunction(this.Time);
      window.requestAnimationFrame((timestamp) => { this.Loop(timestamp) });
    }
  }

  Pause(){
    this.play = false;
    this.pause = true;
  }

  Play(){
    if(!this.play){
      this.play = true;
      this.pause = false;
      window.requestAnimationFrame((timestamp) => { this.Loop(timestamp) });
    }
  }
}
