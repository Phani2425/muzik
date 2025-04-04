const max_timestamp = 2000000000; // time stamp in unix time of 2033 and will be used for allowing redis to store the tracks according to timestamp they got added instead of lexicographically when two tracks ahve the same votes
const multiplier = 1000000000; //one billion  

export {max_timestamp,multiplier};
//ok why are we taking one billion as multiplayer???

//so here the scenario was we have votes for some tracks and we need to sort them on the basis of that primarily but when two tracks have the same votes then we need to sort them on the basis of the time they aree being added
//so basically here we need to store both values at one place and as we know to store 2 value at one variable we use a approach :- in which we must have the maximum possibel range of two numbers
//so let the max possible range of the vote can be 1000 or 10000 and the max possible range for timesatmp is unimaginable but for now lets take it as timestamp of 1033 i.e 2 billion
//then in step 2 we choose the value with maximum range as a adder(will get added with someone lets name it as A) and we choose a value just more than highest range of A as multiplier let M
//what we do is we we multiply M with 2nd number and add A 
//as M is greater than the max range of A so by dividing the result with M will give us the 2nd number and their modulus will give us the A

//but here thing is little different like we will not store time stamp as with time timesatmp increases and if we store timesatmp then the song added early will have more priority than the older song so we will use a technique in which we will
// take the max range of A and subtract A from it in this way the subtraction result will be taken as A
//and the number more than the maximum range of that sutraction will be taken as the M
//as 2025 have timestamp num around:- 1700000000 so max range of substractiion will be around 300000000 so for easiness we will take 1 billion as M

// so what will we do is:- vote * multiplier + (max_timestamp - current_timestamp)

// Unix timestamps are typically in seconds since January 1, 1970 (UTC).

// However, some systems (like JavaScript's Date.now()) return milliseconds, so you often need to divide by 1000 to convert it to Unix time.

// Example:
// Unix timestamp in seconds → 1712183024

// Milliseconds (JS Date.now()) → 1712183024123

//so current_timestamp = Math.floor(Date.now()/1000)