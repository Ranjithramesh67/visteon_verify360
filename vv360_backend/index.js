const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./config/db");


const userRouter = require("./routes/userRoutes");
const invoiceRouter = require("./routes/invoiceRoutes");
const customerVeplRouter = require("./routes/customerVeplRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  credentials: true,
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));

// Connect to the database
connectDB();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send("Hello from Visteon app 2");
});


// user routes
app.use("/api/users", userRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/customer_vepl", customerVeplRouter);

// Backend server port listen
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
