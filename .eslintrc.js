module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: 'airbnb-base',
  rules: {
    'no-underscore-dangle': [2, { allowAfterThis: true }],
    'no-param-reassign': ['error', { props: false }],
    'no-mixed-operators': ['error', { allowSamePrecedence: false }],
  },
};
