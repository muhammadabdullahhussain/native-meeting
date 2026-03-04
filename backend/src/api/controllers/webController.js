exports.home = (req, res) => {
  res.render("index", { title: "Interesta - Connect with your tribe" });
};

exports.about = (req, res) => {
  res.render("about", { title: "About Us - Interesta" });
};

exports.safety = (req, res) => {
  res.render("safety", { title: "Safety Center - Interesta" });
};

exports.help = (req, res) => {
  res.render("help", { title: "Help & Support - Interesta" });
};

exports.legal = (req, res) => {
  res.render("legal", { title: "Legal & Privacy - Interesta" });
};

exports.pricing = (req, res) => {
  res.render("pricing", { title: "Premium Pricing - Interesta" });
};
