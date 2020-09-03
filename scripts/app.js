function init() {
  
  // Elements

  const startScreen = document.querySelector('.start-screen')
  const optionsScreen = document.querySelector('.options-screen')
  const gameScreen = document.querySelector('.game')
  const pauseScreen = document.querySelector('.pause-screen')
  const gameoverScreen = document.querySelector('.gameover-screen')

  const gridDiv = document.querySelector('.grid')
  const previewWindow = document.querySelector('.preview')
  const previewCells = document.querySelectorAll('.preview-cell')
  const holdWindow = document.querySelector('.hold')
  const holdCells = document.querySelectorAll('.hold-cell')
  const levelDisplay = document.querySelector('#level-display')
  const scoreDisplay = document.querySelector('#score-display')

  const sfx = document.querySelector('#sfx')
  const bgmA = document.querySelector('#bgmA')
  const bgmB = document.querySelector('#bgmB')

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

  // const colors = [ 'Yellow', 'Orange', 'DodgerBlue', 'LimeGreen', 'Red', 'MediumPurple', 'DarkTurquoise' ]

  const speeds = [1000, 800, 620, 480, 360, 270, 210, 160, 130, 110]

  let nextBlock = null
  let activeBlock = null
  let blockId = null
  let holdBlock = null
  let blockRotation = 0
  let clearing = false
  let fall = true

  let score = 0
  let lines = 0
  let consecutiveLines = 0
  let level = 1

  let gameTimer
  let frameTimer
  let currentPlayer = 'a'
  let loopTimer = 31900
  let musicSpeed = 1

  // Options

  const options = {
    sfx: true,
    ghost: true,
    mono: false,
    music: 'eightBit1'
  }

  const music = {
    eightBit1: ['The Crane Dance.WAV', 31900],
    eightBit2: ['The Crane Dance.WAV', 31900],
    zone1: ['rain.wav', 42700],
    zone2: ['rain.wav', 42700],
    off: [false, 0]
  }

  // Objects

  class CellInfo {
    constructor(state = 0, tile = 0) {
      // States : 0: empty, 1 falling , 2: set, 3: move on clear
      this.state = state
      this.tile = tile
      
    }
  }

  // Functions

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

    if (gameoverScreen.style.display === 'block') return

    for (let i = 0; i < width * height; i++) {
      const cell = document.querySelector(`[data-id='${i}']`)

      if (grid[i].state > 0) {
        let tilePath
        if (options.mono) {
          tilePath = `./images/mono/tile_${grid[i].tile}.png`
        } else {
          tilePath = `./images/tile_${grid[i].tile}.png`
        }
        cell.style.background = `url(${tilePath})`
        cell.style.backgroundSize = 'cover'

      } else {
        cell.style.background = ''
        cell.style.boxShadow = ''
        cell.style.opacity = '1'
        // cell.style.backgroundColor = options.mono
        //   ? 'rgb(71, 17, 197)' : '#222'
      }

    }

    if (grid.some(cell => cell.state === 1) && options.ghost) {

      const dropDistance = findGhost(1)

      grid.forEach((cell, index) => {
        if (cell.state === 1) {
          const landingCell = document.querySelector(`[data-id='${index + (dropDistance * width)}']`)
          landingCell.style.backgroundColor = '#333'
        }
      })
    }
    
    
  }

  function findGhost(drop) {

    let valid = true

    grid.forEach((cell, index) => {

      if (cell.state !== 1) return

      const landingCell = grid[index + (drop * width)]
      if (landingCell === undefined) {
        valid = false
      } else if (landingCell.state > 1) {
        valid = false
      }
    })

    if (!valid) {
      return drop - 1
    } else {
      return findGhost(drop + 1)
    }

  }


  function spawnBlock() {

    const spawnPosition = Math.floor(width / 2 - 1)

    let blocked = false

    activeBlock = blocks[nextBlock]

    activeBlock.forEach((line, yIndex) => {
      line.forEach((cell, xIndex) => {
        const cellToCheck = (yIndex * width) + xIndex + spawnPosition
        if (grid[cellToCheck].state !== 0) {
          clearInterval(gameTimer)
          blocked = true
          gameover()
        }
      })
    })

    if (blocked) return

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


    drawPreviews(nextBlock, previewWindow, previewCells)
    drawPreviews(holdBlock, holdWindow, holdCells)
    
  }

  function drawPreviews(block, window, cells) {

    if (block === null) return

    // Get block width and create a centering value for the preview window
    const blockSize = blocks[block].length
    window.style.marginLeft = blockSize === 4 ? '' : '2.4vh'

    // Get tile
    const tilePath = options.mono
      ? `./images/mono/tile_${block}.png` : `./images/tile_${block}.png`

    // Draw preview
    cells.forEach(cell => cell.style.background = '')
    for (let i = 0; i < blockSize; i++) {
      for (let j = 0; j < blockSize; j++) {
        
        if (blocks[block][i][j] === 1) {
          cells[i * 4 + j].style.background = `url(${tilePath})`
          cells[i * 4 + j].style.backgroundSize = 'cover'
        }
      }
    }
  }

  
  function controlBlock(event) {

    if (event.keyCode === 27) pauseGame() 
    
    // Disable controls on pause
    if (pauseScreen.style.display === 'block') return

    switch (event.keyCode) {
      case 16:
        hold()
        break
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

  function redrawBlock(pivotPoint) {
    
    // Find grid location of falling block and remove it
    let location = null
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[(i * width) + j].state === 1) {
          location = location === null ? [ j, i ] : location
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
    
    // Redraw block to grid
    activeBlock.forEach(line => {
        
      line.forEach((cell, index) => {
        if (cell === 1) {
          grid[(location[1] * width) + location[0] + index] = new CellInfo(1, blockId)
        }
      })
      location[1]++
    })
  }

  function rotateBlock(direction) {
    
    const pivotPoint = pivots[blockId][blockRotation]
    activeBlock = rotateArray(activeBlock, direction)
    blockRotation = (blockRotation + 1) % 4

    redrawBlock(pivotPoint)

    sfx.paus
    sfx.src = './sounds/rotate.ogg'
    sfx.play()
  }

  function hold() {

    // Shuffle blocks in memory
    const pivotPoint = pivots[blockId][blockRotation]
    const swap = blockId

    if (holdBlock === null) {
      blockId = nextBlock
      nextBlock = Math.floor(Math.random() * blocks.length)
      holdBlock = swap
    } else {
      blockId = holdBlock
      holdBlock = swap
    }

    blockRotation = 0
    activeBlock = blocks[blockId]

    redrawBlock(pivotPoint)
    drawPreviews(nextBlock, previewWindow, previewCells)
    drawPreviews(holdBlock, holdWindow, holdCells)

    sfx.src = './sounds/hold.ogg'
    sfx.play()
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

      // Sound effect
      if (!clearing) {
        sfx.src = './sounds/lock.ogg'
        sfx.play()
      }

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

        addScore()
        lines++
        if (lines % 10 === 0) {
          
          level = Math.min(9, level + 1)
          levelDisplay.innerHTML = level

          if (lines <= 100) {
            loopTimer /= 1.03
            musicSpeed *= 1.03
          }
          
          clearInterval(gameTimer)
          gameTimer = setInterval(dropBlocks, speeds[level])
        }

        const dropDelay = consecutiveLines === 0 ? 200 : 0
        consecutiveLines++

        setTimeout(dropBlocks, dropDelay)
      }
    }

    if (consecutiveLines === 4) {
      sfx.src = './sounds/tetris.ogg'
      sfx.play()
    } else if (consecutiveLines > 0) {
      sfx.src = './sounds/line_clear.ogg'
      sfx.play()
    }

    consecutiveLines = 0

  }

  function addScore() {
    const base = level * 40
    const multiplier = [1, 1.5, 3, 9][consecutiveLines]

    score += base * multiplier
    scoreDisplay.innerHTML = score
  }

  function openOptions() {
    
    startScreen.style.display = 'none'
    optionsScreen.style.display = 'block'
  }

  function saveOptions(event) {
    event.preventDefault()
    
    bgmA.volume = options.music ? 0.7 : 0
    bgmB.volume = options.music ? 0.7 : 0
    sfx.volume = options.sfx ? 1 : 0
    

    optionsScreen.style.display = 'none'
    startScreen.style.display = 'block'
  }

  function pauseGame() {

    if (gameTimer !== null) {
      clearInterval(gameTimer)
      gameTimer = null

      gameScreen.style.display = 'none'
      pauseScreen.style.display = 'block'

    } else {
      gameTimer = setInterval(dropBlocks, speeds[level])

      gameScreen.style.display = 'block'
      pauseScreen.style.display = 'none'
    }
  }

  function gameover() {
    // Pause music
    bgmA.pause()
    bgmB.pause()

    // Reset state
    grid = null
    nextBlock = null
    activeBlock = null
    blockId = null
    holdBlock = null
    blockRotation = 0
    clearing = false
    fall = true
    score = 0
    lines = 0
    consecutiveLines = 0
    level = 0
    gameTimer = null
    frameTimer = null
    currentPlayer = 'a'
    loopTimer = 31900
    musicSpeed = 1

    for (let i = 0; i < width * height; i++) {
      document.querySelector(`[data-id='${i}']`).remove()
    }

    clearInterval(gameTimer)
    clearInterval(frameTimer)

    // Change view
    gameScreen.style.display = 'none'
    gameoverScreen.style.display = 'block'
  }

  function goToMenu() {
    startScreen.style.display = 'block'
    gameoverScreen.style.display = 'none'
    gameScreen.style.display = 'none'
  }

  function startGame() {

    startScreen.style.display = 'none'
    gameoverScreen.style.display = 'none'
    gameScreen.style.display = 'block'


    if (options.music !== 'off') {
      setTimeout(loopMusic, 500)
    }

    // Initialise starting state
    creategrid()
    nextBlock = Math.floor(Math.random() * blocks.length)
    spawnBlock()

    gridDiv.style.backgroundColor = options.mono
      ? 'rgb(71, 17, 197)' : '#222'

    
    // Start movement
    gameTimer = setInterval(dropBlocks, 1000)

    // Define draw speed
    frameTimer = setInterval(drawGrid, 20)
  }

  function loopMusic() {

    if (gameoverScreen.style.display === 'block') return
      
    let player = null

    if (currentPlayer === 'a') {
      player = bgmB
      currentPlayer = 'b'
    } else {
      player = bgmA
      currentPlayer = 'a'
    }

    player.src = `./sounds/${music[options.music][0]}`
    player.load()
    player.playbackRate = musicSpeed
    player.play()

    setTimeout(loopMusic, loopTimer) // the length of the audio clip in milliseconds.
  }

  function radioOption(event) {

    sfx.src = './sounds/lock.ogg'
    sfx.play()

    const musicChoice = event.target.getAttribute('data-music')

    options.music = musicChoice
    loopTimer = music[musicChoice][1]

    document.querySelectorAll('.radio-button').forEach(button => {
      button.src = './images/tile_4.png'
    })

    event.target.src = './images/tile_3.png'

  }

  function toggleOption(event) {

    if (event.target.nodeName !== 'IMG') return

    sfx.src = './sounds/lock.ogg'
    sfx.play()
    
    const optionName = event.target.getAttribute('data-option')

    options[optionName] = !options[optionName]

    event.target.src = options[optionName] ? './images/tile_3.png' : './images/tile_4.png'

    if (optionName === 'mono') {
      changeStyle()
    }
  }

  function changeStyle() {
    if (options.mono) {
      gridDiv.style.backgroundColor = 'rgb(71, 17, 197)'
      startScreen.style.backgroundColor = 'rgb(71, 17, 197)'
      optionsScreen.style.backgroundColor = 'rgb(71, 17, 197)'
      pauseScreen.style.backgroundColor = 'rgb(71, 17, 197)'
      gameoverScreen.style.backgroundColor = 'rgb(71, 17, 197)'

      const buttons = document.querySelectorAll('.button')
      buttons.forEach(button => {
        button.style.backgroundColor = 'rgb(230, 62, 154)'
        button.style.color = 'rgb(40, 10, 121)'
      })

      document.querySelector('#logo').src = './images/mono/logo.png'
    } else {
      
      gridDiv.style.backgroundColor = '#222'
      startScreen.style.backgroundColor = '#222'
      optionsScreen.style.backgroundColor = '#222'
      pauseScreen.style.backgroundColor = '#222'
      gameoverScreen.style.backgroundColor = '#222'
      
      const buttons = document.querySelectorAll('.button')
      buttons.forEach(button => {
        button.style.backgroundColor = '#222'
        button.style.color = '#aaa'
      })

      document.querySelector('#logo').src = './images/logo.png'
    }
  }

  
  
  
  

  // Attach controls
  document.addEventListener('keydown', controlBlock)

  document.querySelectorAll('.start').forEach(button => {
    button.addEventListener('click', startGame)
  })

  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', () => {
      sfx.src = './sounds/button_click.wav'
      sfx.play()
    })
  })
  
  document.querySelector('.menu').addEventListener('click', goToMenu)
  document.querySelector('#options').addEventListener('click', openOptions)
  document.querySelector('#save-options').addEventListener('click', saveOptions)

  document.querySelectorAll('.toggle').forEach(button => {
    button.addEventListener('click', toggleOption)
  })

  document.querySelectorAll('.radio-button').forEach(button => {
    button.addEventListener('click', radioOption)
  })
  
}

window.addEventListener('DOMContentLoaded', init)