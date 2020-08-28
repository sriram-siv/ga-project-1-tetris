function init() {
  
  // Elements
  const gridDiv = document.querySelector('.grid')
  const levelDisplay = document.querySelector('#level-display')

  // Variables
  const width = 10
  const height = 20

  let grid

  const blocks = [
    [
      [1, 1],
      [1, 1]
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1]
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0]
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0]
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0]
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  ]

  const pivots = [
    [
      // Square
      [0, 0], [0, 0], [0, 0], [0, 0]
    ],
    [
      // L
      [1, 0], [0, 1], [0, 0], [2, 0]
    ],
    [
      // J
      [1, 0], [0, 0], [1, 0], [0, 1]
    ],
    [
      // S
      [0, 0], [1, 0], [1, 0], [1, 1]
    ],
    [
      // Z
      [1, 0], [0, 0], [2, 0], [0, 1]
    ],
    [
      // T
      [0, 1], [1, 0], [1, 0], [1, 0]
    ],
    [
      // I
      [0, 1], [2, 0], [0, 2], [1, 0]
    ]
  ]

  const colors = [ 'Yellow', 'Orange', 'DodgerBlue', 'LimeGreen', 'Red', 'MediumPurple', 'DarkTurquoise' ]

  const speeds = [1000, 794, 617, 472, 355, 262, 190, 135, 94, 64]

  let nextBlock = null
  let activeBlock = null
  let blockId = null
  let blockRotation = 0
  let clearing = false
  let fall = true

  let lines = 0

  // Objects

  class CellInfo {
    constructor(state = 0, tile = 0) {
      // States : 0: empty, 1 falling , 2: set, 3: move on clear
      this.state = state
      this.tile = tile
    }
  }

  // Functions

  function clickCell(event) {
    console.log(event.target.getAttribute('data-id'))
  }

  function rotateArray(array, direction = 1) {

    const result = []
  
    for (let i = 0; i < array[0].length; i++) {
      result.push([])
      for (let j = 0; j < array.length; j++) {
        result[i].unshift(array[j][i])
      }
    }
  
    if (direction === -1) {
      result.forEach(line => line.reverse())
      result.reverse()
    }
  
    return result
  }

  function creategrid() {
    grid = []
    for (let i = 0; i < width * height; i++) {

      // Create grid for game logic
      grid.push(new CellInfo())

      // Create cell for display in flex-box
      const cell = document.createElement('div')
      cell.classList.add('cell')
      cell.setAttribute('data-id', i)
      cell.addEventListener('click', clickCell) // Just for debugging
      gridDiv.appendChild(cell)
    }
  }

  function drawGrid() {
    for (let i = 0; i < width * height; i++) {
      const cell = document.querySelector(`[data-id='${i}']`)

      if (grid[i].state > 0) {
        // const tilePath = `./images/tile_${grid[i].tile}.png`
        // cell.style.background = `url(${tilePath})`
        cell.style.backgroundColor = colors[grid[i].tile]
        cell.style.backgroundSize = 'contain'
      } else {
        cell.style.background = ''
      }

    }
  }


  function spawnBlock() {

    const spawnPosition = Math.floor(width / 2 - 1)

    let gameOver = false

    activeBlock = blocks[nextBlock]

    activeBlock.forEach((line, yIndex) => {
      line.forEach((cell, xIndex) => {
        const cellToCheck = (yIndex * width) + xIndex + spawnPosition
        if (grid[cellToCheck].state !== 0) {
          clearInterval(gameTimer)
          gameOver = true
        }
      })
    })

    if (gameOver) return

    // Draw block into starting position
    let drawLine = 0
    activeBlock.forEach(line => {
      line.forEach((cell, i) => {
        grid[drawLine + spawnPosition + i].state = cell
        grid[drawLine + spawnPosition + i].tile = nextBlock
      })
      // Move to next line of grid after current line is inserted
      drawLine += width
    })

    blockId = nextBlock
    blockRotation = 0

    nextBlock = Math.floor(Math.random() * blocks.length)


    // printBlockState()
  }

  // function printBlockState() {
  //   // console.clear()
  //   activeBlock.forEach(line => console.log(line, '\n')) //*reverseArray
  // }

  // function printGridState() {
  //   console.clear()
  //   for (let i = 0; i < height; i++) {
  //     let printLine = ''
  //     for (let j = 0; j < width; j++) {
  //       printLine += grid[(i * width) + j].state
  //     }
  //     console.log(printLine)
  //   }
  // }

  function controlBlock(event) {

    switch (event.keyCode) {
      case 37:
        moveBlock('left')
        break
      case 38:
        while (fall) dropBlocks()
        break
      case 39:
        moveBlock('right')
        break
      case 40:
        dropBlocks()
        break
      case 88:
        rotateBlock(1)
        break
      case 90:
        rotateBlock(-1)
        break
      default:
    }
  }

  function moveBlock(direction) {


    // Define variables according to direction
    const touchingEdge = direction === 'left' ? 0 : 9
    const isEdge = direction === 'left' ? 9 : 0
    const shiftValue = direction === 'left' ? -1 : 1
    
    // Check next column is free
    let move = true
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].state === 1 && i % width === touchingEdge) {
        move = false
      }
      if (grid[i].state === 1 && grid[i + shiftValue].state === 2) {
        move = false
      }
    }

    // Shift all cells
    if (move) {
      grid = grid.map((cell, i) => {
        
        // Cell is on edge and contains falling block
        if (grid[i].state === 1 && i % width === isEdge) return new CellInfo()

        // Return all other edge cells as normal
        if (i % width === isEdge) return cell

        // If cell to side contains falling block return 1
        if (grid[i - shiftValue].state === 1) {
          return new CellInfo(1, grid[i - shiftValue].tile)
        }

        // All trailing edges of falling block become 0
        if (grid[i].state === 1) return new CellInfo()

        // Everything else stays in place
        return cell
      })
    }
  }

  function rotateBlock(direction) {

    
    // Rotate current block
    const pivotPoint = pivots[blockId][blockRotation]
    activeBlock = rotateArray(activeBlock, direction)
    blockRotation = (blockRotation + 1) % 4 //activeBlock.length *reverseArray

    
    // Find grid location of falling block and remove it
    let blockColor
    let location = null
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[(i * width) + j].state === 1) {
          location = location === null ? [ j, i ] : location
          blockColor = grid[(i * width) + j].tile
          grid[(i * width) + j] = new CellInfo()
        }
      }
    }

    // Return if no falling block found 
    if (location === null) return

    // Apply pivot point calculation unless it would move out of bounds
    location[0] = Math.max(0, location[0] - pivotPoint[0])
    location[1] = Math.max(0, location[1] - pivotPoint[1])

    
    // Shift location if it would collide with a boundary or block
    let validMove = false
    while (!validMove) {
      validMove = true
      
      activeBlock.forEach((line, yIndex) => { //*reverseArray
        line.forEach((cell, xIndex) => {
          if (cell !== 1) return

          const cellToCheck = ((location[1] + yIndex) * width) + (location[0] + xIndex)

          // If the cell to place in is occupied by another block, shift the position up
          if (grid[cellToCheck] === undefined || grid[cellToCheck].state === 2) {
            location[1]--
            validMove = false
          }
          
          // If the cell is a boundary shift laterally
          if (location[0] + xIndex > 9) {
            location[0]--
            validMove = false
          }
          
        })
      })
    }

    // printGridState()
    
    // Redraw block to grid
    activeBlock.forEach(line => { //*reverseArray
        
      line.forEach((cell, index) => {
        if (cell === 1) {
          grid[(location[1] * 10) + location[0] + index] = new CellInfo(1, blockColor)
        }
      })
      location[1]++
    })
  }

  function dropBlocks() {

    // Is the next line free
    fall = true
    for (let i = 0; i < grid.length; i++) {
      // Find falling blocks (normal or in clearing process) that are blocked below
      if ((grid[i].state === 1 || grid[i].state === 3 ) && (grid[i + width] === undefined || grid[i + width].state === 2)) {
        fall = false
      }

    }

    // Move all cells that contain falling blocks down if so
    if (fall) {
      grid = grid.map((cell, i) => {
        // Generate emtpy line for top row
        if (grid[i - width] === undefined) return new CellInfo()

        // Move falling blocks down 1 cell
        if (grid[i - width].state === 1) {
          return new CellInfo(1, grid[i - width].tile)
        }
        
        // Move blocks that are falling due to line clearing down 1 cell
        if (grid[i - width].state === 3) {
          return new CellInfo(3, grid[i - width].tile)
        }
        
        // Set blocks remain in place
        if (cell.state === 2) {
          return cell
        }

        // Everything else is an empty space
        return new CellInfo()
      })
    } else {

      // Solidify cells by turning state => 2
      grid = grid.map((cell) => {
        return cell.state === 1 || cell.state === 3
          ? new CellInfo(2, cell.tile) : cell
      })

      // Clear completed lines
      clearLines()

      // Generate new block
      if (!clearing) spawnBlock()
      clearing = false

      // Print grid to console
      // printGridState()

    }
  }

  function clearLines() {

    // Cycle through each horizontal line of the grid
    for (let i = 0; i < height; i++) {

      // Check if all cells have a state of 2
      const line = grid.slice(i * width, (i + 1) * width).map(cell => cell.state)
      const clear = line.every(cell => cell === 2)

      if (clear) {
        clearing = true
  
        // Remove line from grid
        for (let j = i * width; j < (i + 1) * width; j++) {
          grid[j] = new CellInfo()
        }

        // Move all lines above down into empty space
        grid.map((cell, index) => {
          if (grid[index].state === 2 && index < i * width) grid[index].state = 3
        })

        dropBlocks()

        lines++
        if (lines % 10 === 0) {

          const level = Math.min(lines / 10, speeds.length - 1)
          levelDisplay.innerHTML = level

          clearInterval(gameTimer)
          gameTimer = setInterval(dropBlocks, speeds[level])
        }
      }
    }



  }

  
  
  
  // Initialise starting state
  creategrid()
  nextBlock = Math.floor(Math.random() * blocks.length)
  spawnBlock()
  
  // Start movement
  let gameTimer = setInterval(dropBlocks, 1000)

  // Define draw speed
  setInterval(drawGrid, 20)

  // Attach controls
  document.addEventListener('keydown', controlBlock)
}

window.addEventListener('DOMContentLoaded', init)