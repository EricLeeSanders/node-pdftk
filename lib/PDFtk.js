var os = require('os');
var child = require('child_process');
var fs = require('fs');
var shellescape = require('shell-escape');
var _ = require('underscore');


/**
 * Return a new instance of PDFtk
 */
function PDFtk(pdftkPath) {

    //Windows: Demand path to lib
    if (isWindowsPlatform()) {
        this.exec = child.execFile;
        if (!pdftkPath || !fs.existsSync(pdftkPath)) {
            throw new Error('Path to PDFtk is incorrect.');
        }
        this.pdftkPath = pdftkPath;
        this.isWin = true;
    } else {
        this.exec = child.exec;
    }

    return this;
}

/**
 * Windows or not?
 */
function isWindowsPlatform() {

    return os.type().indexOf('Windows') !== -1;
}

/**
 * Gets and returns the number of pages a PDF has
 */
PDFtk.prototype.numPages = function(file, callback) {

    var execArgs = file + " dump_data | grep NumberOfPages | awk '{print $2}'"
    if (this.isWin) {
        this.exec(this.pdftkPath, execArgs, execCallbackHandler)
    } else {
        this.exec('pdftk ' + execArgs, execCallbackHandler);
    }

    function execCallbackHandler(error, stdout, stderr) {
        if (error) {
            return callback(error);
        }

        return callback(error, stdout);
    }
}


/**
 * Function that runs the PDFtk split command.
 */
PDFtk.prototype.split = function(file, splits, newFilePath, callback) {
    var splitExecArgs = assembleExecArgsSplit.call(this, file, splits, newFilePath);

    //Windows or not, different syntax
    if (this.isWin) {
        this.exec(this.pdftkPath, splitExecArgs, execCallbackHandler);
    } else {
        this.exec('pdftk ' + splitExecArgs.join(' '), execCallbackHandler);
    }

    function execCallbackHandler(error) {
        callback(error);
    }
};

/**
 * Arguments for running PDFtk split
 * @returns {*}
 */
function assembleExecArgsSplit(file, splits, newFilePath) {

    var execArgs = [];
    var strSplits = splits.toString();
    strSplits = strSplits.replace(/,/g, ' ')
    execArgs.push(file, 'cat', strSplits, 'output', this.isWin ? newFilePath : shellescape([newFilePath]));
    return execArgs;
}



/**
 * Function that runs the PDFtk merge command.
 * @param callback
 */
PDFtk.prototype.merge = function(files, newFilePath, callback) {

    var mergeExecArgs = assembleExecArgsMerge.call(this, files, newFilePath);
    //Windows or not, different syntax
    if (this.isWin) {
        this.exec(this.pdftkPath, mergeExecArgs, execCallbackHandler);
    } else {
        this.exec('pdftk ' + mergeExecArgs.join(' '), execCallbackHandler);
    }

    function execCallbackHandler(error) {
        callback(error);
    }
};


/**
 * Arguments for running PDFtk merge
 * @returns {*}
 */
function assembleExecArgsMerge(files, newFilePath) {

    var execArgs = _.chain(files).clone()
        .map(function(file) {
            if (this.isWin) {
                return file;
            }
            return shellescape([file]);
        }.bind(this))
        .value();
    execArgs.push('cat', 'output', this.isWin ? newFilePath : shellescape([newFilePath]));
    return execArgs;
}


/**
 * Function that runs the PDFtk burst command.
 * @param callback
 */
PDFtk.prototype.burst = function(file, newFilePath, callback) {
    var burstExecArgs = assembleExecArgsBurst.call(this, file, newFilePath);

    //Windows or not, different syntax
    if (this.isWin) {
        this.exec(this.pdftkPath, burstExecArgs, execCallbackHandler);
    } else {
        this.exec('pdftk ' + burstExecArgs.join(' '), execCallbackHandler);
    }

    function execCallbackHandler(error) {
        callback(error);
    }
};

/**
 * Arguments for running PDFtk burst
 * @returns {*}
 */
function assembleExecArgsBurst(file, newFilePath) {
    var execArgs = [];
    execArgs.push(file, 'burst', 'output', this.isWin ? newFilePath : shellescape([newFilePath]));
    return execArgs;
}


module.exports = PDFtk;
