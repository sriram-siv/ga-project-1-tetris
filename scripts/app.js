function init() {
  
  // Elements

  const startScreen = document.querySelector('.start-screen')
  const optionsScreen = document.querySelector('.options-screen')
  const controlsScreen = document.querySelector('.controls-screen')
  const creditsScreen = document.querySelector('.credits-screen')
  const gameScreen = document.querySelector('.game')
  const pauseScreen = document.querySelector('.pause-screen')
  const gameoverScreen = document.querySelector('.gameover-screen')

  const gridDiv = document.querySelector('.grid')
  let displayCells = []
  let glowCells = []
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
  const height = 21

  let grid

  const blocks = [
    [
      [1, 1],
      [1, 1]
    ],
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
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
      [2, 0], [1, 0], [0, 1], [0, 0]
    ],
    [
      // J
      [0, 0], [1, 0], [0, 1], [1, 0]
    ],
    [
      // S
      [1, 0], [1, 0], [1, 1], [0, 0]
    ],
    [
      // Z
      [0, 0], [2, 0], [0, 1], [1, 0]
    ],
    [
      // T
      [1, 0], [1, 0], [0, 1], [1, 0]
    ],
    [
      // I
      [0, 1], [2, 0], [0, 2], [1, 0]
    ]
  ]

  // const colors = [ 'Yellow', 'Orange', 'DodgerBlue', 'LimeGreen', 'Red', 'MediumPurple', 'DarkTurquoise' ]

  const speeds = [1000, 800, 650, 540, 440, 350, 270, 200, 140, 90, 80]

  let nextBlock = null
  let activeBlock = null
  let blockId = null
  let holdBlock = null
  let blockRotation = 0
  let fall = true

  let score = 0
  let lines = 0
  let consecutiveLines = 0
  let level = 0

  let gameTimer
  let frameTimer
  let currentPlayer = 'a'
  let loopTimer = null
  let musicSpeed = 1

  // Options

  const options = {
    sfx: true,
    ghost: true,
    mono: false,
    music: 'eightBit1'
  }

  const music = {
    eightBit1: 31900,
    eightBit2: 16000,
    zone1: 42700,
    zone2: 42000,
    off: 0
  }

  // Objects

  class CellInfo {
    constructor(state = 0, tile = 0) {
      // States : 0: empty, 1 falling , 2: set
      this.state = state
      this.tile = tile
    }
  }

  // Functions

  // Return an array rotated by 90deg (direction - 1:cw / -1:ccw)
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
      // Except for the first line which remains off screen
      const cell = document.createElement('div')
      if (i >= width) {
        cell.classList.add('cell')
        cell.setAttribute('data-id', i)
        gridDiv.appendChild(cell)
      }
      displayCells.push(cell)

      const glowGrid = document.querySelector('.glow')
      const glowCell = document.createElement('div')
      glowCells.push(glowCell)
      if (i >= width) {
        // glowCell.setAttribute('data-glow', i)
        glowCell.classList.add('glow-cell')
        glowGrid.appendChild(glowCell)
      }
    }
  }

  function drawGrid() {

    if (frameTimer === null) return

    for (let i = width; i < width * height; i++) {

      const cell = document.querySelector(`[data-id='${i}']`)
      cell.style.background = ''
      glowCells[i].style.boxShadow = ''

      if (grid[i].state > 0) {

        let tilePath
        if (options.mono) {
          tilePath = `./images/mono/tile_${grid[i].tile}.png`
        } else {
          tilePath = `./images/tile_${grid[i].tile}.png`
        }
        cell.style.background = `url(${tilePath})`
        cell.style.backgroundSize = 'cover'

        // Draw glow
        glowCells[i].style.boxShadow = options.mono
          ? '0 0 8px pink' : '0 0 8px white'
      }
    }

    // Draw ghost
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
      if (landingCell === undefined || landingCell.state > 1) {
        valid = false
      }
    })

    return valid ? findGhost(drop + 1) : drop - 1

  }


  function spawnBlock() {

    // Half of width
    let spawnPosition = Math.floor(width / 2 - 1)

    let blocked = false

    activeBlock = blocks[nextBlock]

    // Check if block can fit into grid
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
    activeBlock.forEach(line => {
      line.forEach((cell, i) => {
        grid[spawnPosition + i] = new CellInfo(cell, nextBlock)
      })
      // Move to next line of grid after current line is inserted
      spawnPosition += width
    })

    blockId = nextBlock
    blockRotation = 0
    nextBlock = Math.floor(Math.random() * blocks.length)

    drawPreviews(nextBlock, previewWindow, previewCells)
    drawPreviews(holdBlock, holdWindow, holdCells)
    
  }

  function drawPreviews(block, window, cells) {

    // If no hold block yet
    if (block === null) return

    // Get block width and create a centering value for the preview window
    const blockSize = blocks[block].length
    const padding = blockSize === 4
      ? '' : blockSize === 3
        ? '2.4vh' : '3.6vh'
    window.style.left = padding
    window.style.top = padding

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

  function clearPreviews() {

    const windows = [previewCells, holdCells]

    windows.forEach(window => {
      window.forEach(cell => {
        cell.style.background = ''
      })
    })
  }

  
  function controlBlock(event) {

    // Game over
    if (frameTimer === null) return

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
      
      activeBlock.forEach((line, yIndex) => {
        line.forEach((cell, xIndex) => {
          // Only check for falling blocks
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
    } else {
      blockId = holdBlock
    }
    holdBlock = swap

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
      // Find falling blocks that are blocked below
      if (grid[i].state === 1 && (grid[i + width] === undefined || grid[i + width].state === 2)) {
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
        
        // Set blocks remain in place
        if (cell.state === 2) {
          return cell
        }

        // Everything else is an empty space
        return new CellInfo()
      })

    } else { // Block has reached the bottom of the well

      // Sound effect
      sfx.src = './sounds/lock.ogg'
      sfx.play()

      // Solidify cells by turning state => 2
      grid = grid.map((cell) => {
        return cell.state === 1
          ? new CellInfo(2, cell.tile) : cell
      })

      // Clear completed lines
      flash()
      setTimeout(clearLines, 200)

      // Generate new block
      spawnBlock()
    }
  }

  function flash() {

    displayCells.forEach(cell => cell.classList.remove('flash'))

    // Find all completed lines
    for (let i = 0; i < height; i++) {
      const line = grid.slice(i * width, (i + 1 ) * width)

      if (line.every(cell => cell.state === 2)) {
        // Apply animation class
        for (let j = 0; j < width; j++) {
          const displayCell = displayCells[i * width + j]
          displayCell.classList.add('flash')

          glowCells[i * width + j].style.backgroundColor = 'white'
        }
      }
    }
  }

  function clearLines() {

    let completeLine = null

    // Cycle through each horizontal line of the grid
    for (let i = 0; i < height; i++) {

      // Find last line that is full and set as line to clear
      const line = grid.slice(i * width, (i + 1) * width).map(cell => cell.state)
      const clear = line.every(cell => cell === 2)
      if (clear) completeLine = i

    }

    if (completeLine !== null) {
      
      // Delete line
      for (let i = 0; i < width; i++) {
        grid[completeLine * width + i] = new CellInfo()
      }

      // Shift all lines above
      const lastBlockInClearedLine = (completeLine + 1) * width - 1
      for (let i = lastBlockInClearedLine; i >= 0; i--) {

        // Do not shift falling blocks
        if (grid[i].state === 1) continue

        // Top row returns blank cells
        if (grid[i - width] === undefined) {
          grid[i] = new CellInfo()
          continue
        }

        //  Do not shift falling blocks
        if (grid[i - width].state === 1) {
          grid[i] = new CellInfo()
          continue
        }

        // Everything else
        grid[i] = grid[i - width]
      }

      consecutiveLines++

      // Call the function recursively until no complete lines are found
      clearLines()

    } else {

      // Play line clear sound
      if (consecutiveLines > 0) {
        sfx.src = consecutiveLines === 4
          ? './sounds/tetris.ogg' : './sounds/line_clear.ogg'
        sfx.play()
      }
      
      addScore()
      
      // Increase line count in a loop so that the level up isn't skippedd
      for (let i = 0; i < consecutiveLines; i++) {
        lines++
  
        if (lines % 10 === 0) {
          
          level = Math.min(speeds.length - 1, level + 1)
          levelDisplay.innerHTML = level
        
          if (lines <= speeds.length * 10) {
            loopTimer /= 1.03
            musicSpeed *= 1.03
          }
        
          // Restart game timer with new level speed
          clearInterval(gameTimer)
          gameTimer = setInterval(dropBlocks, speeds[level])
        }
      }

      // Reset
      consecutiveLines = 0

      glowCells.forEach(cell => cell.style.backgroundColor = '')
    }
  }

  function addScore() {
    const base = (level + 1) * 40
    const multiplier = [0, 1, 2.5, 7.5, 30][consecutiveLines]

    score += base * multiplier
    scoreDisplay.innerHTML = score
  }


  // MENUS AND OPTIONS

  function openOptions() {
    startScreen.style.display = 'none'
    optionsScreen.style.display = 'block'
  }

  function openControls() {
    startScreen.style.display = 'none'
    controlsScreen.style.display = 'block'
  }

  function openCredits() {
    startScreen.style.display = 'none'
    creditsScreen.style.display = 'block'
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

  function gameover(sound = true) {
    // Pause music
    bgmA.pause()
    bgmB.pause()

    if (sound) {
      sfx.src = './sounds/gameover.wav'
      sfx.play()
    }

    // Reset state
    grid = null
    nextBlock = null
    activeBlock = null
    blockId = null
    holdBlock = null
    blockRotation = 0
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
      const cell = document.querySelector(`[data-id='${i}']`)
      if (cell) cell.remove()
    }

    displayCells = []

    clearPreviews()
    clearInterval(gameTimer)
    clearInterval(frameTimer)

    // Change view
    gameScreen.style.display = 'none'
    gameoverScreen.style.display = 'block'
  }

  function goToMenu() {

    gameover(false)

    startScreen.style.display = 'block'
    gameoverScreen.style.display = 'none'
    gameScreen.style.display = 'none'
    optionsScreen.style.display = 'none'
    pauseScreen.style.display = 'none'
    controlsScreen.style.display = 'none'
    creditsScreen.style.display = 'none'
  }

  // Reload page so that music loop is killed
  function restartGame() {
    location.reload()
  }

  function startGame() {

    startScreen.style.display = 'none'
    gameoverScreen.style.display = 'none'
    gameScreen.style.display = 'block'

    // Initialise options

    loopTimer = music[options.music]

    if (options.music !== 'off') {
      setTimeout(loopMusic, 500)
    }

    bgmA.volume = options.music ? 0.7 : 0
    bgmB.volume = options.music ? 0.7 : 0

    gridDiv.style.backgroundColor = options.mono
      ? 'rgb(71, 17, 197)' : '#222'
    
    // Initialise starting state
    creategrid()
    nextBlock = Math.floor(Math.random() * blocks.length)
    spawnBlock()
    
    // Start movement
    gameTimer = setInterval(dropBlocks, 1000)

    // Define draw speed
    frameTimer = setInterval(drawGrid, 20)
  }

  function loopMusic() {

    if (frameTimer === null) return
      
    let player = null

    if (currentPlayer === 'a') {
      player = bgmB
      currentPlayer = 'b'
    } else {
      player = bgmA
      currentPlayer = 'a'
    }

    player.src = `./sounds/${options.music}.wav`
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
    loopTimer = music[musicChoice]

    document.querySelectorAll('.radio-button').forEach(button => {
      button.src = './images/tile_4.png'
    })

    event.target.src = './images/tile_3.png'

    saveOptions()
  }

  function toggleOption(event) {
    
    const optionName = event.target.getAttribute('data-option')
    
    options[optionName] = !options[optionName]
    
    event.target.src = options[optionName] ? './images/tile_3.png' : './images/tile_4.png'
    
    if (optionName === 'mono') {
      changeStyle()
    }
    
    if (optionName === 'sfx') {
      sfx.volume = options.sfx ? 1 : 0
    }

    sfx.src = './sounds/lock.ogg'
    sfx.play()

    saveOptions()
  }

  function changeStyle() {

    const bgColor = options.mono ? 'rgb(71, 17, 197)' : '#222'
    const buttonColor = options.mono ? 'rgb(230, 62, 154)' : '#222'
    const buttonText = options.mono ? 'rgb(40, 10, 120)' : '#aaa'
    const titleLogo = options.mono ? './images/mono/logo.png' : './images/logo.png'
    
    gridDiv.style.backgroundColor = bgColor
    startScreen.style.backgroundColor = bgColor
    optionsScreen.style.backgroundColor = bgColor
    controlsScreen.style.backgroundColor = bgColor
    creditsScreen.style.backgroundColor = bgColor
    pauseScreen.style.backgroundColor = bgColor
    gameoverScreen.style.backgroundColor = bgColor

    const buttons = document.querySelectorAll('.button')
    buttons.forEach(button => {
      button.style.backgroundColor = buttonColor
      button.style.color = buttonText
    })

    document.querySelector('#logo').src = titleLogo
  }

  function loadOptions() {
    if (localStorage.sfx !== undefined) {
      options.sfx = localStorage.sfx
      options.ghost = localStorage.ghost
      options.mono = localStorage.mono
      options.music = localStorage.music

      // Convert back to boolean
      Object.keys(options).forEach(key => {
        if (options[key] === 'true') {
          options[key] = true
        }
        if (options[key] === 'false') {
          options[key] = false
        }
      })

      if (options.mono) changeStyle()

      if (!options.sfx) sfx.volume = 0

      document.querySelectorAll('.radio-button').forEach(button => {
        button.src = './images/tile_4.png'
        
        if (options.music === button.getAttribute('data-music')) {
          button.src = './images/tile_3.png'
        }
      })

      document.querySelectorAll('.toggle-button').forEach(button => {
        const optionName = button.getAttribute('data-option')
        button.src = './images/tile_4.png'
        
        if (options[optionName]) {
          button.src = './images/tile_3.png'
        }
      })

      if (localStorage.restart) {
        startGame()
        localStorage.removeItem('restart')
      }

    }
  }

  function saveOptions() {
    localStorage.setItem('sfx', options.sfx)
    localStorage.setItem('ghost', options.ghost)
    localStorage.setItem('mono', options.mono)
    localStorage.setItem('music', options.music)
  } 

  // Attach controls
  document.addEventListener('keydown', controlBlock)

  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', () => {
      sfx.src = './sounds/button_click.wav'
      sfx.play()
    })
  })

  document.querySelectorAll('.start').forEach(button => {
    button.addEventListener('click', startGame)
  })
  
  document.querySelectorAll('.menu').forEach(button => {
    button.addEventListener('click', goToMenu)
  })

  document.querySelectorAll('.restart').forEach(button => {
    button.addEventListener('click', restartGame)
  })

  document.querySelector('#options').addEventListener('click', openOptions)
  document.querySelector('#controls').addEventListener('click', openControls)
  document.querySelector('#credits').addEventListener('click', openCredits)

  document.querySelectorAll('.toggle-button').forEach(button => {
    button.addEventListener('click', toggleOption)
  })

  document.querySelectorAll('.radio-button').forEach(button => {
    button.addEventListener('click', radioOption)
  })

  loadOptions()
}

window.addEventListener('DOMContentLoaded', init)