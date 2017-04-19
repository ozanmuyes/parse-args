function parsePattern(pattern) {
  if (typeof pattern !== 'string') {
    return new Error('Pattern must be string.');
  }

  const result = [];

  const args = pattern.split(',');
  const argsCount = args.length;

  for (let i = 0; i < argsCount; i += 1) {
    let arg = args[i]; // Current argument in arguments as string
    let argLen = arg.length; // Current argument string length
    const argObj = {
      name: '',
      type: '',
      alternatives: [],
      isOptional: false,
    };

    if (argLen === 0) {
      return new SyntaxError('Empty argument definition in pattern.');
    }

    if (arg[0] === '[') {
      if (arg[argLen - 1] === ']') {
        argObj.isOptional = true;

        // Delete brackets since 'optional' is gathered
        arg = arg.slice(1, -1);
        argLen -= 2;

        if (argLen === 0) {
          return new SyntaxError('Empty argument definition in pattern.');
        }
      } else {
        return new SyntaxError('Argument started as optional but closing bracket missing.');
      }
    }

    const argTypes = arg.split('|');
    const argTypesLen = argTypes.length;

    for (let j = 0; j < argTypesLen; j += 1) {
      const argType = argTypes[j]; // Argument type as string

      let [theName, theType] = argType.split(':');

      if (typeof theType === 'undefined') {
        [theName, theType] = ['', theName];
      }

      if (j === 0) {
        // the argument type

        argObj.name = theName;
        argObj.type = theType;
      } else {
        // alternative argument type

        argObj.alternatives.push({
          name: (theName || argObj.name),
          type: theType,
        });
      }
    }

    result.push(argObj);
  }

  return result;
}

/**
 * Parse the arguments by given pattern and
 * returns an object filled with values. If
 * an error occurs returns the error instead
 * of throwing it.
 *
 * @param  {Array} args    Original arguments of caller function
 * @param  {String} pattern A guide that shows how to construct resultant object
 * @return {Object|Error}         The object that contains keys from 'pattern'
 *                                and values from 'args'
 */
function parseArgs(args, pattern) {
  if (typeof args !== 'object' || !Array.isArray(args)) {
    throw new Error('Arguments must be array.');
  }

  const patternObj = parsePattern(pattern);

  if (patternObj instanceof Error) {
    throw patternObj;
  }

  const [minArgCount, maxArgCount] = patternObj.reduce((acc, curr) => {
    if (!curr.isOptional) {
      acc[0] += 1;
    }

    acc[1] += 1;

    return acc;
  }, [0, 0]);

  const argsCount = args.length;
  if (argsCount < minArgCount) {
    throw new RangeError(`Given argument count (${argsCount}) is less than the argument count defined in pattern (${minArgCount}-${maxArgCount}).`);
  } else if (argsCount > maxArgCount) {
    throw new RangeError(`Given argument count (${argsCount}) is greater than the argument count defined in pattern (${minArgCount}-${maxArgCount}).`);
  }

  const result = {};

  for (let i = 0, lastMatchedIndex = 0; i < argsCount; i += 1, lastMatchedIndex += 1) {
    const arg = args[i];
    let argType = typeof arg;
    const argObj = {
      value: null,
      type: '',
      name: '',
    };

    if (argType === 'object' && Array.isArray(arg)) {
      argType = 'array';
    }

    for (let j = lastMatchedIndex, matchIndex = 0; j < maxArgCount; j += 1) {
      const patternObjTypes = [patternObj[j].type];
      patternObj[j].alternatives.forEach(alternative => patternObjTypes.push(alternative.type));
      const argTypeIndexInPattern = patternObjTypes.indexOf(argType);

      const patternObjTypesNext = [];
      if (j + 1 < maxArgCount) {
        patternObjTypesNext.push(patternObj[j + 1].type);
        patternObj[j + 1].alternatives.forEach(
          alternative => patternObjTypesNext.push(alternative.type) // eslint-disable-line
        );
      }

      if (argTypeIndexInPattern > -1) {
        // arg type and first type in the pattern are matched
        matchIndex = j;

        let argTypeNext = '';
        if (i + 1 < argsCount) {
          argTypeNext = typeof args[i + 1];

          if (argTypeNext === 'object' && Array.isArray(arg)) {
            argTypeNext = 'array';
          }
        }

        if (
          j + 1 < maxArgCount && argsCount < maxArgCount &&
          patternObj[j].isOptional && !patternObj[j + 1].isOptional &&
          i + 1 < argsCount && !patternObjTypesNext.includes(argTypeNext) &&
          patternObjTypesNext.includes(argType)
        ) {
          matchIndex = j + 1;
          lastMatchedIndex += 1;
        }

        patternObj[matchIndex].isMatched = true;

        argObj.value = arg;
        argObj.type = argType;
        argObj.name = (argTypeIndexInPattern === 0)
          ? patternObj[matchIndex].name
          : patternObj[matchIndex].alternatives[argTypeIndexInPattern - 1].name;
      }

      // Remember `argObj.value` itself may be 'null', therefore we can not count on it
      if ((argObj.type.length + argObj.name.length) > 1) {
        // argument matched

        break;
      }
    }

    // Remember `argObj.value` itself may be 'null', therefore we can not count on it
    if ((argObj.type.length + argObj.name.length) === 0) {
      throw new TypeError(`The argument #${i + 1} ('${args[i].toString()}') could not be matched against the pattern.`);
    }

    result[i] = argObj;
    if (argObj.name.length > 0) {
      result[argObj.name] = argObj;
    }
  }

  // Check if there are any unmatched required (not optional) arguments left
  for (let j = 0; j < patternObj.length; j += 1) {
    if (
      !patternObj[j].isOptional &&
      (!Object.prototype.hasOwnProperty.call(patternObj[j], 'isMatched') || !patternObj[j].isMatched)
    ) {
      throw new Error(`There is at least one unmatched argument (${patternObj[j].name}) exists.`);
    }
  }

  return result;
}

module.exports = parseArgs;

