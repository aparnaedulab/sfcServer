var models  = require('../models');
var crypto = require('crypto');
var randomstring = require('randomstring');
var encryptor = require('simple-encryptor')('je93KhWE08lH9S7SN83sneI87');
var Sequelize = require('sequelize');
var moment = require('moment');
var Moment = require('moment-timezone');
var uid = require('uid2');
var fs = require('fs');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var QRCode = require('qrcode');
// var constant = require(root_path+'/config/constant');
require('moment-range');
// var sendGridMail = require('@sendGrid/mail');
var constants = require('../config/constant');
var request = require('request').defaults({encoding: null});
var cloudconvert = new (require('cloudconvert'))('37ghbio4CcT3N7mdKAPQNIniRg78R8EkJEMn31UQ_t3u24Uty9ab0MMByNO4euNuPXhVoa3ItJY-Vz_A1kDuyw');

algorithm = 'aes-256-ctr',
password = 'je93KhWE08lH9S7SN83sneI87';

module.exports = {
    receipt_pdf : function(requestername, mobilenum, emailReq, country, verfiername, emailVer, GSTIN, Srno, seatno, docname, monthyear,stream,sem,fees,Scharge,total,gst,Gtotal,receiptno,date, callback){
		
		var requestername = requestername;
		var mobilenum = mobilenum;
		var emailReq = emailReq;
		var country = country;
		var verfiername =  verfiername;
		var emailVer = emailVer;
		var GSTIN = GSTIN;
		var Srno = Srno;
		var seatno = seatno;
		var docname = docname;
		var monthyear = monthyear;
		var stream = stream;
		var sem = sem;
		var fees = fees;
		var Scharge = Scharge;
		var total = parseInt(fees)+parseInt(Scharge);
		var gst = gst;
		var receiptno = receiptno;
		var date = date;
		var Gtotal = parseInt(total) + parseInt(gst);

		// var requestername = "francis pinto";
		// var mobilenum = "9594078624";
		// var emailReq = "francis78624@gmail.com";
		// var country = "India";
		// var verfiername = "Secure Credentials";
		// var emailVer = "support@educred.co.in";
		// var GSTIN = "27AADCA3292Q275";
		// var Srno = "1";
		// var seatno = "123";
		// var docname = "marksheet";
		// var monthyear = "May 2006";
		// var stream = "Bachelor of arts";
		// var sem = "THREE YEAR DEGREE COURSE";
		// var fees = "1000";
		// var Scharge = "275";
		// var total = parseInt(fees)+parseInt(Scharge);
		// var gst = "49";
		// var receiptno = "1750";
		// var date = "08-04-2022";
		// var Gtotal = parseInt(total) + parseInt(gst);
		
		
		 filename = "receipt_pdf";
		
		// var dir = constants.FILE_LOCATION+'public/upload/transcript/'+user_id;
		// var file_Dir = constants.FILE_LOCATION+'public/upload/transcript/'+user_id;
		
		// var dir = constants.FILE_LOCATION+'public/upload/transcript/';
		// var file_Dir = constants.FILE_LOCATION+'public/upload/transcript/';
		var dir
        var file_Dir
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
		
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION+'public/fonts/pdf_fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION+'public/fonts//pdf_fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION+'public/fonts//pdf_fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION+'public/fonts//pdf_fonts/Roboto-MediumItalic.ttf'
			  }
		};
		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');

		var docDefinition = {
			// playground requires you to assign document definition to a variable called dd


			content: [
				[{
																			style: {
																				fontSize: 8,
																				bold: false,
																			},
																			canvas: [
																				{ type: 'line', x1: 520, y1: 0, x2: 0, y2: 0, }
																			]
																		}, ''],
				[{
																	style: {
																		fontSize: 6,
																		bold: false,
																	},
																	table: {
																		widths: [250,250],
																		// //headerRows: 1,
																		body: [
																			// [{ text: 'Receipt No :'+receiptno                                                                                                                                                                + 'Date:'+date, alignment: 'right', fontSize: 9, bold: true,  },   ],
																			[{text: 'Receipt No :'+receiptno, alignment: 'left', fontSize: 9, bold: true, }, {text: 'Date:'+date, alignment: 'right', fontSize: 9, bold: true, }],
																		]
																	},
																	layout: 'noBorders',
																}, ''],
																[{ text: '\n', }, ''],
															
																
																
																
				[{
																			style: {
																				fontSize: 8,
																				bold: false,
																			},
																			canvas: [
																				{ type: 'line', x1: 520, y1: 0, x2: 0, y2: 0, }
																			]
																		}, ''],	
																		
																			[{ text: '\n', }, ''],
															
																		
				[{
												style: {
													fontSize: 6,
													bold: false,
												},
												table: {
													widths: [500],
													// //headerRows: 1,
													body: [
														[{ text: 'INVOICE ', alignment: 'center', fontSize: 10, bold: true,  },],
													]
												},
												layout: 'noBorders',
											}, ''],
											[{ text: '\n', }, ''],
											
		
																
					[{
																	style: {
																		fontSize: 6,
																		// bold: true,
																		alignment: 'center',
																		// margin: [10, 0, 0, 200],
																	},
																	table: {
																		widths: [250, 250, 200],
																		// //headerRows: 1,
																		body: [
																			[ { text: 'Requested By	', alignment: 'left', bold : true,}, { text: 'Verifier Details', alignment: 'left', bold: true }],
																			[ { text: 'Name     :'+ requestername+'\n'+'Mobile    :'+mobilenum+'\n'+'Email ID  :'+emailReq+'\n'+'Country   :'+country+'\n\n\n', alignment: 'left',rowSpan:4, bold : true,border:[1,1,0,0] }, { text: 'Name    :'+verfiername +'\n'+'Email ID :'+emailVer+'\n'+'GSTIN    :'+GSTIN, alignment: 'left', rowSpan:4, bold : true,border:[1,1,0,0]}],
																			[ { text: '60% and above but below 75%', alignment: 'center', }, { text: 'Grade I', alignment: 'center', }],
																			[ { text: '45% and above but below 60%', alignment: 'center', }, { text: 'Grade II', alignment: 'center', }],
																			[ { text: ' All other successful candidates (including the exempted) ', alignment: 'center', }, { text: 'Grade Pass', alignment: 'center', }],
																			
																	   // 	[ { text: 'Requested By	', alignment: 'left', bold : true,}, { text: 'Verifier Details', alignment: 'left', bold: true }, { text: 'Verifier Details', alignment: 'left', bold: true }],
																		
																		   //	[{text: 'Header 1',}, {text: 'Header 2', style: 'tableHeader'}, {text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},],
																		   
																		]
																	},
																		
			
																}, ''],
																	
																
						{
						style: {
																		fontSize: 6,
																		// bold: true,
																		alignment: 'center',
																		// margin: [10, 0, 0, 200],
																	},
					table: {
						widths: [38,38,38,38,38,38,38,38,38,38,39],
						body: [
							[{text: 'Sr No.\n\n\n', bold: true}, {text: 'Name', style: 'tableHeader', bold: true}, {text: 'Seat No.', bold: true},{text: 'Document\nName', bold: true},{text: 'Month and Year Of Passing', bold: true},{text: 'Stream', bold: true},{text: 'Branch', bold: true},{text: 'Semester', bold: true},{text: 'Fees', bold: true},{text: 'Service Charges', bold: true},{text: 'Total', bold: true},],
							[{text: Srno,  alignment: 'right'}, {text:requestername, alignment: 'right'}, {text: seatno, alignment: 'right'},{text: docname, alignment: 'right'},{text: monthyear, style: 'tableHeader'},{text: stream, alignment: 'right'},{text: '', alignment: 'right'},{text: sem, alignment: 'right'},{text: fees , alignment: 'right'},{text:  Scharge, alignment: 'right'},{text: total,alignment: 'right'},],
							[{text: 'Total Value:', style: 'tableHeader',alignment:'right',colSpan:10, bold: true}, {text: 'Header 2', style: 'tableHeader'}, {text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: total, style: 'tableHeader',alignment:'right', bold: true},],
							[{text: 'Total GST:', style: 'tableHeader',alignment:'right',colSpan:10, bold: true}, {text: 'Header 2', style: 'tableHeader'}, {text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: gst, style: 'tableHeader',alignment:'right', bold: true},],
							[{text: 'Grand Total:', style: 'tableHeader',alignment:'right',colSpan:10, bold: true}, {text: 'Header 2', style: 'tableHeader'}, {text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: 'Header 3', style: 'tableHeader'},{text: Gtotal, style: 'tableHeader',alignment:'right', bold: true},],
						
						]
					},
				
				},
																
																
																
			]
	

			
		  }


//		var fonts = doc.fonts;
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},
}