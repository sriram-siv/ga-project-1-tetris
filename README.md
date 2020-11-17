<div style="text-align: center">
# GA PROJECT 1: TETRIS

### BRIEF

Create a simple front-end application in the style of a classic computer game, using core web technologies.

### TIMEFRAME

7 days.

![](README/logo%202.png)

### OVERVIEW

I decided on Tetris as my game to remake in the browser as I was aware that it was one of the more challenging games to make and was excited to try my hand at implementing the array manipulation and collision detection that I knew would be tricky to get right.

Having played a lot of Tetris I was quite familiar with the mechanics as well as the additional features that could be included on top of the base experience. The final product included visual and audio theming, block storing, preview windows, drop shadows and levels with speed increases.

### PROCESS

I started by planning how the game would keep track of all blocks in the grid; I settled on representing the 10x20 grid as a single array of values, where 1 would represent a block and 0 a blank space.

To test this and get something displaying on screen I simply set blocks to spawn by changing the middle ‘block’ (array item) of the top row to a 1 and then moving it along the array by 10 places every second - this corresponds to one move down .
The ‘ground’ of the well could be determined simply by checking that the current block index plus 10 was out of the array bounds.
The movement function would check for this condition and stop the block from moving before spawning a new one at the top.

In order to differentiate the blocks that were resting at the bottom from the falling blocks I added a third state to the array: a value of 2 would indicate a resting block.
The drop function would now change all values of 1 to 2 before  spawning a new block.

This solution was simple and effective, but it did lead me down an unhelpful path; at some point in the development there were 5 states that the cells could be in, including blocks that were falling as a result of a line clear, and empty cells that were part of the falling block.
This all became much too unwieldy and eventually I chose to write more functions rather than trying to make each one more reusable which made the code much cleaner.
For example, the function for clearing lines and moving all higher lines down was now completely separate from the regular ‘block-fall’ function.

#### BLOCKS

The other major element to the game was the actual blocks or tetrominoes as they are known; 7 in total representing all the ways in which 4 single blocks can be attached together.

![](README/TetrisRM_1%202.png)

These would be represented as 2-dimensional arrays with the same system of 1 and 0 for filled or empty space. They could then be spawned onto the grid by randomly selecting one of the set and drawing each individual block to the grid. 
The blocks are instantiated from a simple Cell class. This contains two properties - the state and the tile colour. Upon spawning a new block the colour would be set according to the Tetromino type (as shown above) which then allowed for consistently drawing the different coloured blocks. This was a major addition as having the distinct colours not only gives the game a visual boost but also allows the player to quickly recognise the blocks by the colour as well as the shape.

#### CONTROLS

The basic controls of the game were horizontal movement and rotation. The movement was effected by shift all of the cells in a falling Tetromino along the array by 1 or -1. I had to do a series of boolean checks to see if the move was valid; if any of the blocks were in the 10th column a move to the right was not allowed and similarly any blocks in the 1st column could not move left. I was able to check for this by testing if the original position was divisible by 10 or had a remainder of 9. I could also check for the presence of another block by simply checking the value of the destination cell.

example here

 Rotation was a bit more complex. For starters there is the question of how a Tetromino rotates. Most of the pieces are not completely symmetrical and so a point of rotation is not obvious. I did some research and found the intended rotational behaviour and set about implementing it.

My first approach was to create an array of values that gave the correct x and y axis shift for each block rotation. The rotated block would then be redrawn to the grid relative to its original position using these coordinates.
This approached failed due to the fact that some rotations were around single blocks and others were around the nexus of four blocks.

 image here to explain

 split the above image to use it here instead
The solution that I ended up with was to represent the Tetrominoes as square arrays, regardless of their actual shape. This way the rotation becomes automatic due to how the piece is placed within the square.


![](README/rotation%202.gif)


The rotation of the pieces is handled by a function that takes in a 2D array and returns a copy that is rotated by 90degrees.

```javascript
function rotateArray(array, direction = 1) {
  const result = []
  for (let i = 0; i < array[0].length; i++) {
    result.push([])
    for (let j = 0; j < array.length; j++) {
      result[i].unshift(array[j][i])
    }
  }
	// Direction could be set as -1 to rotate the other way
  if (direction === -1) {
    result.forEach(line => line.reverse())
    result.reverse()
  }
  return result
}
```

remove this to somewhere else
Player movement was another place in which the 1 dimensional array caused a lot of fiddly code with multiple modulus checks.
This is the major thing that I would change if I were to revise the code. I think that a good workaround could have been to have a conversion function that allowed for switching between indexing on 1D and 2D arrays.
This is essentially what I did but because I didn’t turn it into a standalone function, the process often got in the way of code readability.

### MANAGING TIMERS

The main function for moving the blocks down the screen is called using an interval, which can be reduced in length every time a new level is reached.

Another timer is needed for rendering the game to the screen. This one runs at 60 frames per second and allows for player movement to be recognised immediately.

A third timer is used for looping the music. The standard behaviour for looping music in HTML5 leaves a small gap in between the loops; this would take the player out of the game and just sound bad in general. I found a workaround to this by playing music through two different audio sources. When one source finished playing the music track the second one would start playing immediately thereby eliminating the loading delay. When changing the music, the music loop would also have its timer set according to the length of the track.

 code here

#### CLEARING LINES

Clearing completed lines is achieved via a function that runs every time a block hits the ground. The basic principle is to see whether a whole section (10 indexes) of the board array (from any index divisible by 10) has a state of 2 (representing resting blocks).

My first implementation did this as a single process. It would find all completed lines and delete them, then drop the blocks on lines above down into the empty space. This had a bug which resulted in floating blocks when multiple lines were cleared. I fixed this by keeping track of how many lines were cleared. Successive lines would then drop by an increasing amount of lines. This worked but it ended up being very messy code.

 image of floating lines here

This was my first opportunity to solve a real problem using recursion. The function now only clears the first complete line that it identifies and then calls itself again. The consecutive lines are still recorded for scoring but the code is much more readable and clean than the original implementation.

If the function finds no complete lines it runs the code block for adding to the score and resets the lines cleared variable. The score is calculated using the equation from the original game that is document on CodeWars as a challenge to recreate. It uses the level and the consecutive line clears as multipliers to a base value. 

```javascript
function clearLines() {
    let completeLine = null
    // Cycle through each horizontal line of the grid
    for (let i = 0; i < height; i++) {
    // Find last line that is full and set as line to clear
	  // This is done by taking a slice of ten blocks and checking if they are all in a '2' state (set after falling).
      const line = grid.slice(i * width, (i + 1) * width).map(cell => cell.state)
      const clear = line.every(cell => cell === 2)
      if (clear) completeLine = i
    }
    if (completeLine !== null) {
		...
      // Delete line by initialising each block
      // Shift all lines above
		...
		// Track multi-line clear for scoring purposes
      consecutiveLines++
      // Call the function recursively until no complete lines are found
      clearLines()
    } else // Play line clear sound and add score
  }
```

At this point the line clearing was totally function but it did not feel right when playing the game. Upon completing a line, it would instantaneously disappear. This was a problem because the audio / visual feedback in a game is really important to creating good game feel.

image of diff delays

I put a small (200ms) delay on the line clear function call and created another function to be called immediately that would trigger a flash effect. It would use the same logic to find all completed lines and then apply a flash animation to them. This lasts for the same length as the delay and doesn’t interfere with the timing of the game at all - a new block will spawn at the same speed regardless of a line clear.

#### DROP SHADOWS

The experience with recursion turned out to be useful further along the project when I implemented the ‘drop shadow’ feature. This is a projection of where the block will fall and allows for faster gameplay.

![](README/drop-shadow%202.png)

This feature took a little while to get right, but iI ended up with quite readable code due to the use of recursion. The function checks if the space below is free and if so calls itself recursively and passes along a counter that keeps track of how many spaces have been checked.
If the check fails, the function draws a shadow below the block using the counter to decide the distance.

 code here

#### STORING AND PREVIEWING BLOCKS

Another extra feature that I was really excited to add was the ability to switch out blocks into a holding area and see what the next block to spawn would be.
The preview was achieved by spawning blocks into a new variable (nextBlock) rather than directly to the game board. When the game needed a new block, this one would simply be drawn to the screen and then another random block generated for the preview.

The holding block works in a similar way, except that it is generated by the player pressing shift. This swaps the block in play with the holding block or generates a new block to the game board if there is no holding block yet.

These extra features (along with the drop shadow) really make a huge difference to the feel of the game; they allow a player to make strategic decisions and add to the complexity of the game. Once they were added I felt that the game went from feeling like a tech demo to something that felt real and interesting to play, which I am very proud of.

#### FINAL PRESENTATION

A significant amount of time went into the presentation of the game once it was fully functional. I looped the music and had it increase in tempo as the game progressed, which was gave the feeling of being in the zone whilst playing. Another big win on this front was the ‘glow’ effect of the blocks as well as the simple animation upon line-clearance where the line would flash.  Along with the sound effects, these additions really gave a great gameplay feeling.

I also spent some time choosing alternative music and colour schemes in order to create an options menu, again to make the game feel more fleshed out and interactive. Finally, I created a title screen and credits.

### FUTURE IMPROVEMENTS

Looking back at the project there are a few things which I either did not get the time to implement or that I would change about it using the knowledge I have gained since then.

Two features which I was disappointed not to have included at the time were a simple hi-scores leaderboard and also changing the speed at which key presses are registered, to allow for faster gameplay.
This would be a simple fix, with the controls checking for key down and key up, then calling the movement function for the duration between at whatever rate I wanted.

As for structural improvements to the code, there was one issue that caused a lot of issues throughout the development of the game. The game board array is a single  simple array with indexes from 0 - 99 whereas many other parts of the game use a system of 2D (nested) arrays. This means that a lot of conversions are used all over the program. I think a quick improvement for this would have been to write a conversion function rather than writing something specific each time it was needed.
I  also had a lot of trouble working with arrays and issues of mutability; I have since gained an improved understanding of how this works in general so would think that I could improve the code in all the areas where this was an issue.
</div>







