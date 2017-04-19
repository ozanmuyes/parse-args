const expect = require('chai').expect;

const parseArgs = require('../');

describe('parseArgs', () => {
  describe('erroneous calling', () => {
    it('should throw error when both of the arguments are undefined', () => {
      expect(parseArgs.bind(parseArgs))
        .to.throw(Error, 'Arguments must be array.');
    });

    it('should throw error when second argument is undefined', () => {
      expect(parseArgs.bind(parseArgs, [42]))
        .to.throw(Error, 'Pattern must be string.');
    });

    it('should throw error when first argument is null', () => {
      expect(parseArgs.bind(parseArgs, null, 'arg1:string'))
        .to.throw(Error, 'Arguments must be array.');
    });

    it('should throw error when first argument is empty but second is not', () => {
      expect(parseArgs.bind(parseArgs, [], 'arg1:string,[number]'))
        .to.throw(Error, 'Given argument count (0) is less than the argument count defined in pattern (1-2).');
    });

    it('should throw error when there is difference between argument\'s lengths', () => {
      const errorMessageRegexp =
        /Given argument count \(\d+\) is (less|greater) than the argument count defined in pattern \(\d+-\d+\)./;

      expect(parseArgs.bind(parseArgs, [], 'arg1:string'))
        .to.throw(Error, errorMessageRegexp);

      expect(parseArgs.bind(parseArgs, [], 'arg1:string|[number]'))
        .to.throw(Error, errorMessageRegexp);

      expect(parseArgs.bind(parseArgs, [], 'arg1:string|[number],arg2:string'))
        .to.throw(Error, errorMessageRegexp);

      expect(parseArgs.bind(parseArgs, [42], 'arg1:string|[number],arg2:string'))
        .to.throw(Error, errorMessageRegexp);

      expect(parseArgs.bind(parseArgs, [42, 'foo'], 'arg1:string|[number]'))
        .to.throw(Error, errorMessageRegexp);
    });

    it('should throw error if there is at least one unmatched argument exists because of type', () => {
      const errorMessageRegexp =
        /The argument #\d+ \('\w+'\) could not be matched against the pattern./;

      expect(parseArgs.bind(parseArgs, ['foo', 42], 'arg1:string|number,arg2:boolean|function|object'))
        .to.throw(Error, errorMessageRegexp);

      // TODO Add more tests in this context
    });

    // FIXME
    // it('should throw error if there is at least one unmatched argument exists', () => {
    //   const errorMessageRegexp =
    //     /There is at least one unmatched argument \('\w+'\) exists./;
    //
    //   expect(parseArgs.bind(parseArgs, ['foo', true], 'arg1:string,arg2:boolean|number,[arg3:object]'))
    //     .to.throw(Error, errorMessageRegexp);
    //
    //   // TODO Add more tests in this context
    // });
  });

  describe('parsing supported primitive types', () => {
    it('should parse boolean', () => {
      const args = [true, false];
      const pattern = 'boolean,[boolean]';

      const expected = {
        0: {
          name: '',
          type: 'boolean', // TODO (v1.1.0) This should be typeString and type should Boolean or String etc. the real, type classes
          value: true,
        },
        1: {
          name: '',
          type: 'boolean',
          value: false,
        },
      };

      expect(parseArgs(args, pattern)).to.eql(expected);
    });

    it('should parse number', () => {
      const args = [42];
      const pattern = 'number,[number]';

      const expected = {
        0: {
          name: '',
          type: 'number',
          value: 42,
        },
      };

      expect(parseArgs(args, pattern)).to.eql(expected);
    });

    it('should parse string', () => {
      const args = ['foo', 'bar', 'bar'];
      const pattern = 'string,[string],[string]';

      const expected = {
        0: {
          name: '',
          type: 'string',
          value: 'foo',
        },
        1: {
          name: '',
          type: 'string',
          value: 'bar',
        },
        2: {
          name: '',
          type: 'string',
          value: 'bar',
        },
      };

      expect(parseArgs(args, pattern)).to.eql(expected);
    });

    // TODO (v1.1.0) Add Symbol support
  });

  describe('parsing object and array types', () => {
    it('should parse object', () => {
      const theObject = { is: 'this', an: 'object', yes: 'it is' };
      const args = [theObject];
      const pattern = 'object';

      const expected = {
        0: {
          name: '',
          type: 'object',
          value: theObject,
        },
      };

      expect(parseArgs(args, pattern)).to.eql(expected);
    });

    it('should throw error if not object', () => {
      const notAnObject = 13;
      const args = [notAnObject];
      const pattern = 'object';

      expect(parseArgs.bind(parseArgs, args, pattern)).to.throw(Error);
    });

    it('should parse array', () => {
      const theArray = ['is', 'this', 1, 'array', { answer: true }];
      const args = [theArray];
      const pattern = 'array';

      const expected = {
        0: {
          name: '',
          type: 'array',
          value: theArray,
        },
      };

      expect(parseArgs(args, pattern)).to.eql(expected);
    });

    it('should throw error if not array (also not an object)', () => {
      const notAnArrayNorObject = 13;
      const args = [notAnArrayNorObject];
      const pattern = 'array';

      expect(parseArgs.bind(parseArgs, args, pattern)).to.throw(Error);
    });

    it('should throw error if not array (is an object)', () => {
      const notAnArrayButAnObject = { i: 'am', not: 'an', object: 'but', an: 'array' };
      const args = [notAnArrayButAnObject];
      const pattern = 'array';

      expect(parseArgs.bind(parseArgs, args, pattern)).to.throw(Error);
    });

    it('should parse object and array', () => {
      const theObject = { is: 'this', an: 'object', yes: 'it is' };
      const theArray = ['is', 'this', 1, 'array', { answer: true }];
      const args = [theObject, theArray];
      const pattern = 'object,array';

      const expected = {
        0: {
          name: '',
          type: 'object',
          value: theObject,
        },
        1: {
          name: '',
          type: 'array',
          value: theArray,
        },
      };

      expect(parseArgs(args, pattern)).to.eql(expected);
    });

    it('should throw error on object and array due to wrong order', () => {
      const theObject = { is: 'this', an: 'object', yes: 'it is' };
      const theArray = ['is', 'this', 1, 'array', { answer: true }];
      const args = [theArray, theObject];
      const pattern = 'object,array';

      expect(parseArgs.bind(parseArgs, args, pattern)).to.throw(Error);
    });
  });
});

