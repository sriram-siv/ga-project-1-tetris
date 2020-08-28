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