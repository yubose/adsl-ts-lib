export function getActionTokens() {
  //
}

export function run() {
  return new Promise(async (resolve, reject) => {
    try {
      //
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      reject(err)
    }
  })
}
