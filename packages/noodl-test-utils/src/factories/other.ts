const otherObjectsFactory = (function otherObjectsFactory() {
  function override(
    rootKey: string,
    key: string,
    value: any,
  ): { [rootKey: `=.${string}@`]: any }
  function override(
    key: string,
    value: any,
  ): { [rootKey: `=..${string}@`]: any }
  function override(...args: any[]) {
    if (args.length === 3) {
      return { [`.${args[0]}.${args[1]}@`]: args[2] }
    } else {
      return { [`..${args[0]}@`]: args[1] }
    }
  }

  return {
    override,
  }
})()

export default otherObjectsFactory
