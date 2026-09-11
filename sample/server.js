const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).json({ 
        status: "success", 
        message: "Welcome to Sravani Technologies DevOps Training Demo!" 
    });
});

// Export for testing, start if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Application is running on port ${PORT}`);
    });
}

module.exports = app;