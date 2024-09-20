const httpStatus = require("http-status");

const {
  User,
  Producer,
  Product,
  DistributionPoint,
  ActiveDay,
} = require("../models");
const catchAsync = require("../utils/catchAsync");
const { userService, tokenService } = require("../services");
const { fetchStockDetails } = require("./distributionPoint.controller");

const newProducer = catchAsync(async (req, res) => {
  const { name, location, fullName, phone, password } = req.body;

  if (await User.isPhoneTaken(phone)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Phone Already Taken.",
    });
  }

  const admin = await userService.createUser({
    fullName,
    phone,
    password,
    role: "producer",
    monthlyPayment: parseFloat("100"),
  });

  if (!admin) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Failed To Register, Plz Try Again.",
    });
  }

  const producer = await Producer.create({ manager: admin.id, location, name });
  const tokens = await tokenService.generateAuthTokens(admin);

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Registered Successfully.",
    producer,
    tokens,
    user: admin,
  });
});

const editProducer = catchAsync(async (req, res) => {
  const producer = await Producer.findById(req.params.producerId);

  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Producer Not Found.",
    });
  }

  const { name, fullName, phone, password, location } = req.body;

  const manager = await User.findById(producer.manager);
  manager.fullName = fullName;
  manager.phone = phone;
  if (password) manager.password = password;
  await manager.save({ validateBeforeSave: false });

  const producerName = name ? name : producer.name;
  const producerLocation = location ? location : producer.location;
  producer.name = producerName;
  producer.location = producerLocation;

  await producer.save({ validateBeforeSave: false });

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Edited Successfully.",
  });
});

const getProducerByManager = catchAsync(async (req, res) => {
  let producer = await Producer.findOne({ manager: req.query.managerId });
  const activeDay = await ActiveDay.findOne({
    producer: producer.id,
    isActive: true,
  });

  return res.status(httpStatus.OK).json({
    success: true,
    producer,
    activeDay,
  });
});

const getAllProducers = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "User Not Found.",
    });
  }

  let producers = await Producer.find({});

  producers = await Promise.all(
    producers.map(async (producer) => {
      let products = await Product.find({ producer: producer.id });

      products = products.map((p) => {
        return {
          name: p.name,
          id: p._id,
          price: p.price,
          total: p.totalAvailable,
        };
      });

      return {
        managerName: producer.manager.fullName,
        managerPhone: producer.manager.phone,
        location: producer.location,
        id: producer.id,
        name: producer.name,
        products,
      };
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    producers,
  });
});

const getProducer = catchAsync(async (req, res) => {
  const producer = await Producer.findById(req.query.producerId);
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Producer Not Found.",
    });
  }
  let products = await Product.find({ producer: producer.id });
  products = products.map((p) => {
    return {
      name: p.name,
      id: p._id,
    };
  });

  return res.status(httpStatus.OK).json({
    success: true,
    producer: {
      ...producer.toObject(),
      products,
    },
  });
});

const getDistributors = catchAsync(async (req, res) => {
  const producer = await Producer.findById(req.query.producerId);
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Producer Not Found.",
    });
  }
  let distributors = producer.distributionPoints;
  distributors = await Promise.all(
    distributors.map(async (d) => {
      const distributor = await DistributionPoint.findById(d.id).populate(
        "manager",
      );
      if (distributor) {
        return {
          name: distributor.name,
          location: distributor.location,
          id: distributor.id,
          totalPurchases: d.totalPurchases,
          managerName: distributor.manager.fullName,
          managerPhone: distributor.manager.phone,
        };
      }
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    distributors,
  });
});

const getStocks = catchAsync(async (req, res) => {
  const producer = await Producer.findById(req.query.producerId);
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Producer Not Found.",
    });
  }
  const stocks = await fetchStockDetails(producer.stocks);

  return res.status(httpStatus.OK).json({
    success: true,
    stocks,
  });
});

const getCustomers = catchAsync(async (req, res) => {
  const producer = await Producer.findById(req.query.producerId);
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Producer Not Found.",
    });
  }

  let customers = await Promise.all(
    producer.customers.map(async (c) => {
      const user = await User.findById(c.id);
      return {
        id: c.id || user?._id,
        totalPurchases: parseFloat(c.totalPurchases),
        phone: user?.phone,
        name: user?.fullName,
      };
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    customers,
  });
});

module.exports = {
  newProducer,
  editProducer,
  getProducerByManager,
  getProducer,
  getAllProducers,
  getDistributors,
  getStocks,
  getCustomers,
};
