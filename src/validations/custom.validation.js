const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" Must Be A Valid Mongo Id');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message("Password Must Be At Least 8 Characters");
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message(
      "Password Must Contain At Least 1 Letter And 1 Number",
    );
  }
  return value;
};

module.exports = {
  objectId,
  password,
};
