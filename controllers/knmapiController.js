const controller = {

    accessConfirmation : function (req, res, next) {
        if (req.body.knmapikey) {
            if (req.body.knmapikey === process.env.KNM_API_KEY) {
                next();
            }
            else {
                res.status(401).send('Unauthorized: Invalid Access Key');
            }
        }
        else {
            res.status(401).send('Unauthorized: No Access Key Provided');
        }
    }
}

module.exports = controller;