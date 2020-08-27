function init() {
  
  // Elements
  const gridDiv = document.querySelector('.grid')

  // Variables
  const width = 10
  const height = 15

  let grid = []
  
  const squareBlock = [
    [
      [1, 1],
      [1, 1]
    ]
  ]
  const lBlock = [
    [
      [ 1, 0],
      [ 1, 0],
      [ 1, 1]
    ],
    [
      [1, 1, 1],
      [1, 0, 0]
    ],
    [
      [ 1, 1],
      [ 0, 1],
      [ 0, 1]
    ],
    [
      [0, 0, 1],
      [1, 1, 1]
    ]
  ]
  const jBlock = [
    [
      [ 0, 1],
      [ 0, 1],
      [ 1, 1]
    ],
    [
      [1, 0, 0],
      [1, 1, 1]
    ],
    [
      [ 1, 1],
      [ 1, 0],
      [ 1, 0]
    ],
    [
      [1, 1, 1],
      [0, 0, 1]
    ]
  ]
  const tBlock = [
    [
      [1, 1, 1],
      [0, 1, 0]
    ],
    [
      [0, 1],
      [1, 1],
      [0, 1]
    ],
    [
      [0, 1, 0],
      [1, 1, 1]
    ],
    [
      [1, 0],
      [1, 1],
      [1, 0]
    ]
  ]
  const iBlock = [
    [
      [1],
      [1],
      [1],
      [1]
    ],
    [
      [1, 1, 1, 1]
    ],
    [
      [1],
      [1],
      [1],
      [1]
    ],
    [
      [1, 1, 1, 1]
    ]
  ]
  const sBlock = [
    [
      [0, 1, 1],
      [1, 1, 0]
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1]
    ]
  ]
  const zBlock = [
    [
      [1, 1, 0],
      [0, 1, 1]
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0]
    ]
  ]

  let activeBlock = null
  let blockRotation = 0

  // Objects

  class CellInfo {
    constructor(state) {
      this.value = state
    }
  }

  // Functions

  function clickCell(event) {
    console.log(event.target.getAttribute('data-id'))
  }

  function creategrid() {
    for (let i = 0; i < width * height; i++) {

      // Create grid for game logic
      grid.push(0)

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

      if (grid[i] > 0) {
        const random = 1//Math.floor(Math.random() * 9)
        const tilePath = `./images/tile_${random}.png`
        cell.style.background = `url(${tilePath})`
        cell.style.backgroundSize = 'contain'
      } else {
        cell.style.background = ''
      }

    }
  }

  function getBlock() {
    const blocks = [squareBlock, lBlock, jBlock, tBlock, iBlock, sBlock, zBlock]
    const random = Math.floor(Math.random() * blocks.length)

    // Draw block into starting position
    let drawLine = 0
    const spawnPosition = Math.floor(width / 2 - 1)
    blocks[random][0].forEach(line => {
      line.forEach((cell, i) => grid[drawLine + spawnPosition + i] = cell)
      // Move to next line of grid after current line is inserted
      drawLine += width
    })

    activeBlock = blocks[random]
    blockRotation = 0

    printBlockState()
  }

  function printBlockState() {
    console.clear()
    activeBlock[blockRotation].forEach(line => console.log(line, '\n'))
  }

  // function printGridState() {
  //   console.clear()
  //   for (let i = 0; i < height; i++) {
  //     console.log(grid.slice(i * 10, (i * 10) + 10))
  //   }
  // }

  function controlBlock(event) {
    switch (event.keyCode) {
      case 37:
        moveBlock('left')
        break
      case 38:
        rotateBlock()
        break
      case 39:
        moveBlock('right')
        break
      case 40:
        dropBlocks()
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
      if (grid[i] === 1 && i % width === touchingEdge) {
        move = false
      }
      if (grid[i] === 1 && grid[i + shiftValue] === 2) {
        move = false
      }
    }

    // Shift all cells
    if (move) {
      grid = grid.map((cell, i) => {
        
        // Cell is on edge and contains falling block
        if (grid[i] === 1 && i % width === isEdge) return 0

        // Return all other edge cells as normal
        if (i % width === isEdge) return cell

        // If cell to side contains falling block return 1
        if (grid[i - shiftValue] === 1) return 1

        // All trailing edges of falling block become 0
        if (grid[i] === 1) return 0

        // Everything else stays in place
        return cell
      })
    }
  }

  function rotateBlock() {

  }

  function dropBlocks() {

    // Is the next line free
    let fall = true
    for (let i = 0; i < grid.length; i++) {

      if (grid[i] === 1 && (grid[i + width] === undefined || grid[i + width] === 2)) {
        fall = false
      }

    }

    // Move all cells that contain falling blocks down if so
    if (fall) {
      grid = grid.map((cell, i) => {

        if (grid[i - width] === 1) {
          return 1
        }
        if (cell === 2) {
          return 2
        }
        return 0
      })
    } else {
      // Solidify cells by turning 1 => 2
      grid = grid.map(cell => cell === 1 ? 2 : cell)
      

      // Generate new block
      getBlock()

      // Print grid to console
      // printGridState()
    }
  }

  
  
  
  
  // Initialise starting state
  creategrid()
  getBlock()

  // Start movement
  setInterval(() => {
    dropBlocks()
  }, 500)

  // Define draw speed
  setInterval(drawGrid, 20)

  // Attach controls
  document.addEventListener('keydown', controlBlock)
}

window.addEventListener('DOMContentLoaded', init)