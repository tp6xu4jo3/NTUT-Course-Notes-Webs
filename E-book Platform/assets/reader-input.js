// Consume at most one page turn per vertical wheel gesture. A gesture that
// scrolls page content must end before another gesture can turn the page.
export function createWheelGate({idle=180,threshold=60}={}){
  let last=-Infinity,direction=0,amount=0,consumed=false,scrolled=false;
  return ({now,dir,delta,canScroll,busy=false})=>{
    if(now-last>idle||dir!==direction){
      direction=dir;amount=0;consumed=false;scrolled=false;
    }
    last=now;
    if(consumed)return "hold";
    if(busy){consumed=true;return "hold"}
    if(canScroll){scrolled=true;amount=0;return "scroll"}
    if(scrolled)return "hold";
    amount+=Math.abs(delta);
    if(amount>=threshold){consumed=true;return "turn"}
    return "hold";
  };
}
