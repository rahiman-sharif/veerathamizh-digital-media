exports.getHomePage = (req, res) => {
    res.render('pages/home', {
        title: 'Welcome to Veerathamizh Digital Media Group',
        offers: [
            'First banner free',
            'Up to 50% off',
            'Fast delivery guaranteed'
        ]
    });
};
