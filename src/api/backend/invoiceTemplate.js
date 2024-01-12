const config = require('config');
const { FILE_LOCATION, NODEMODULE_LOCATION } = config.get('path');
const { serverUrl } = config.get('api');
var fs = require('fs');
var moment = require('moment');
const { exec } = require('child_process');
const logger = require('../../utils/logger');
var converter = require('number-to-words');
var QRCode = require('qrcode');
const imagesToPdf = require("images-to-pdf")

module.exports = {
    receipt_pdf : function(userId,application_id,tracking_id,order_id,amount,order_status,created_at,user_email,amount_words,callback){
        var filename = application_id + "_Verification_Payment_Challan";
        var gujartph = FILE_LOCATION+ 'public/upload/profile_pic/gujaratUniversityLogo.png';
        var file_Dir = FILE_LOCATION+'public/upload/documents/'+ userId;
        if (!fs.existsSync(file_Dir)){
            fs.mkdirSync(file_Dir);
        }
        
        var fonts = {
            Roboto: {
                normal: FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
                bold: FILE_LOCATION+'public/fonts//Roboto-Medium.ttf',
                italics: FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
                bolditalics: FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
            }
        };
        var PdfPrinter = require(NODEMODULE_LOCATION+'node_modules/pdfmake/src/printer');

        var docDefinition = {
            // playground requires you to assign document definition to a variable called dd


            content: [
                {
                    style:{
                      fontSize: 10,
                      bold: false,
                    } ,
                    table: {
                      widths: [150,200,150],
                      headerRows: 1,
                      body: [
                        ['',{image:gujartph,fit: [60, 60],alignment: 'center'},''],
                        //['',{text:'INTERNATIONAL CENTRE',fontSize: 9,bold:true,alignment: 'center'},''],
                        ['',{text:'GUJARAT UNIVERSITY',fontSize: 9,bold:true,alignment: 'center'},''],
                        ['',{text:'Online Payment Receipt - Verification',fontSize: 8,bold:true,alignment: 'center'},''],
                      ]
                    },
                    layout: 'noBorders',
                  },
                  {
                    style:{
                      fontSize: 10,
                      bold: false,
                    } ,
                    table: {
                      widths: [30, 200, 300],
                      headerRows: 1,
                      body: [
                        [{image: gujartph,fit: [30, 30]},{text:'',fontSize: 7,bold:true},{text:'University Copy',fontSize: 7,bold:true,margin: [210,0,0,0]}],
                        ['',{text:'GUJARAT UNIVERSITY',fontSize: 7,bold:true, margin: [0,-20,0,0]} ,''],
                        ['',{text:'',fontSize: 7,bold:true, margin: [0,-16,0,0]},''],
                      ]
                    },
                    layout: 'noBorders'
                  },
                  {
                    style:{
                      fontSize: 10,
                      bold: false,
                      /*hLineColor : 'gray',
                      vLineColor :'gray',
                      color : 'black'*/
                    } ,
                    table: {
                      widths: [200, 300],
                      headerRows: 1,
                      body: [
                        [{text:'Student\'s registered email ID',fontSize: 10,bold:true},' ' + user_email],
                        [{text:'Application No.',fontSize: 10,bold:true},' ' + application_id],
                        //[{text:'Country Name',fontSize: 10,bold:true}, ' ' ],
                        [{text:'Transaction Id',fontSize: 10,bold:true}, ' ' + tracking_id],
                        [{text:'Payment order ID',fontSize: 10,bold:true}, ' ' + order_id],
                        [{text:'Payment Date & Time',fontSize: 10,bold:true}, ' ' + created_at],
                        [{text:'Payment Amount',fontSize: 10,bold:true}, ' INR ' + amount],
                        [{text:'Payment Amount in words',fontSize: 10,bold:true}, ' ' + amount_words + ' rupees only'],
                        [{text:'Status of payment',fontSize: 10,bold:true}, ' ' + order_status]
                      ]
                    },
                    //layout: 'noBorders'
                  },
                  {text: '',fontSize: 10,bold:true},
                  {text: '',fontSize: 10,bold:true},
                  {text: '',fontSize: 10,bold:true},
                  {text:' ',fontSize: 10,bold:true},
                  {text:'____________________________________________________Cut Here____________________________________________________ ',fontSize: 10,bold:false},
                  {text: '',fontSize: 10,bold:true},
                  {text: '',fontSize: 10,bold:true},
                  {
                    style:{
                      fontSize: 10,
                      bold: false,
                      // hLineColor : 'gray',
                      // vLineColor :'gray',
                      // color : 'black'
                    } ,
                    table: {
                      widths: [150,200,150],
                      headerRows: 1,
                      body: [
                        ['','',''],
                        ['','',''],
                        ['',{image: gujartph,fit: [60, 60],alignment: 'center'},''],
                        //['',{text:'INTERNATIONAL CENTRE',fontSize: 9,bold:true,alignment: 'center'},''],
                        ['',{text:'GUJARAT UNIVERISTY',fontSize: 9,bold:true,alignment: 'center'},''],
                        ['',{text:'Online Payment Receipt - Verification',fontSize: 8,bold:true,alignment: 'center'},''],
                      ]
                    },
                    layout: 'noBorders',
                  },
                  {
                    style:{
                      fontSize: 10,
                      bold: false,
                    } ,
                    table: {
                      widths: [30, 200, 300],
                      headerRows: 1,
                      body: [
                        [{image: gujartph,fit: [30, 30]},{text:'',fontSize: 7,bold:true},{text:'Student Copy',fontSize: 7,bold:true,margin: [210,0,0,0]}],
                        ['',{text:'GUJARAT UNIVERISTY',fontSize: 7,bold:true, margin: [0,-20,0,0]} ,''],
                        ['',{text:'',fontSize: 7,bold:true, margin: [0,-16,0,0]},''],
                      ]
                    },
                    layout: 'noBorders'
                  },
                  {
                    style:{
                      fontSize: 10,
                      bold: false,
                    } ,
                    table: {
                      widths: [200, 300],
                      headerRows: 1,
                      body: [
                        [{text:'Student\'s registered email ID',fontSize: 10,bold:true},' ' + user_email ],
                        [{text:'Application No.',fontSize: 10,bold:true},' ' + application_id],
                        //[{text:'Country Name',fontSize: 10,bold:true}, ' ' ],
                        [{text:'Transaction Id',fontSize: 10,bold:true}, ' ' + tracking_id],
                        [{text:'Payment order ID',fontSize: 10,bold:true}, ' ' + order_id],
                        [{text:'Payment Date & Time',fontSize: 10,bold:true}, ' ' +created_at],
                        [{text:'Payment Amount',fontSize: 10,bold:true}, ' INR ' + amount],
                        [{text:'Payment Amount in words',fontSize: 10,bold:true}, ' ' + amount_words + ' rupees only'],
                        [{text:'Status of payment',fontSize: 10,bold:true}, ' ' + order_status]
                      ]
                    },
                  }
                ],
                 defaultStyle: {
                   alignment: 'justify',
                   fontSize: 10
                }


            
        }


    //		var fonts = doc.fonts;
        var printer = new PdfPrinter(fonts);
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
        pdfDoc.end();
        docDefinition=null;
        callback();
    },

    verificationCertificate : function(userId,documentDetails,documentType,institue,app_id,width,docContent,tablelayout,callback){
        var filename = app_id + "_" + institue.name + "_" + documentType +  "VerificationCertificate.pdf";
        var qrcode_name = app_id + "_" + institue.name + "_" + documentType +"VerificationCertificate_qrcode.png"
        var document_type = '';
        var url = serverUrl + "upload/transcript/"+userId;
        var docType = '';
        if(documentType == 'transcript'){
            document_type = 'Transcript(s)';
            doctype = 'Transcript';
        }else if(documentType == 'marksheet'){
            document_type = 'Marksheet(s)';
            doctype = 'Marksheet';
        }else if(documentType == 'degree'){
            document_type = 'Degree Certificate';
            doctype = '4A/B/Convo';
        }

        var currentYear = moment().format('LL');;
        var file_Dir = FILE_LOCATION + 'public/upload/documents/'+ userId;
        var qrcode = file_Dir+"/"+qrcode_name;
        var currentDateTime = moment(new Date()).format("DD/MM/YYYY");
        
        if (!fs.existsSync(file_Dir)){
            fs.mkdirSync(file_Dir);
        }
    
        var fonts = {
            Roboto: {
                normal: FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
                bold:FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
                italics: FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
                bolditalics: FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
              }
        };

        if(!fs.existsSync(qrcode)){
            QRCode.toFile(file_Dir+"/"+qrcode_name, url+"/"+filename, {
                color: {
                    dark: '#000000',  // Blue dots
                    light: '#FFFF' // Transparent background
                }
            }, function (err) {
                if (err) throw err

                qrcode = file_Dir+"/"+qrcode_name;
            })       
        }
    
        var PdfPrinter = require(NODEMODULE_LOCATION+'node_modules/pdfmake/src/printer');
        
        var docDefinition = {
            pageSize: 'LEGAL',
	        pageOrientation: 'Portrait',
            pageMargins: [40, 60, 40, 80],
            footer: function (currentPage, pageCount) {
                return {
                    table: {
                        widths: ['*','*','*'],
                        body: [
                            [
                                {text : ' ',alignment : 'left'},
                                { text: "Printed On " +currentYear, alignment: 'center', style: 'normalText'},
                                { text: currentPage, alignment: 'right', style: 'normalText'}
                            ]
                        ]
                    },
                    layout: 'noBorders'
                };
            },
            content: [
                {
					style:{
					  fontSize: 10,
					  bold: false,
                      lineHeight:1,
					  color : 'black'
					} ,
					table: {
					  widths: [160,180,160],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'By Post/Registered Post/Air Mail',bold:true,alignment:'left'},'',{text: app_id,alignment:'left'}],
						[{text:'No. Exam/' + doctype + '/301/2022',bold:true,alignment:'left',lineHeight:2}, '',{text:'Date : ' + currentDateTime,alignment:'left',lineHeight:2}],
						[{text:'To,', alignment:'left'},'',''],
                        [{text:institue.name, alignment:'left'},'',''],
                        [{text:institue.address, alignment:'left',lineHeight:2},'',''],
                        ['',{text : 'Sub : Verification of ' + document_type + '.',fontsize:9, alignment :'left',color:'black'},''],
                        ['',{text : 'Ref : No. ' + institue.refNo,fontsize:9, alignment :'left',color:'black',lineHeight:2},''],
					]
					},
					layout: 'noBorders',
                },
                
                {text : 'Dear Sir/Madam,',fontSize:9,bold:true, alignment :'left',lineHeight:1.5},
                {text :docContent,fontSize :9, alignment :'justify',leadingIndent: 40},
                {text : ' ',fontSize:9,bold:true, alignment :'left',lineHeight:2},
                {
                    style:{
                        fontSize: 9,
                        bold: false,
                        
                    } ,
                    table: {
                        //[70,170,24,24,24,24,24],
                        widths: width,
                        headerRows: 1,
                        body: documentDetails,
                        
                    },
                    alignment:'center',
                    layout:tablelayout
                },
                {text:' ', fontSize :8, bold:true},
                {text:'Please acknowledge the receipt. ', fontSize :9, alignment:'left'},
                {text:'Thanking you, ', fontSize :9, alignment:'left'},
                {
                    style:{
                        fontSize: 10,
                        bold: false,
                    } ,
                    table: {
                        widths: [110,270,150],
                        headerRows: 1,
                        body: [
                            ['','',''],
                            ['','',''],
                            ['','',''],
                            ['','',''],
                            ['','',''],
                            ['','',{text:'for, Controller of Examinations.',alignment:'right'}],
                        ]
                    },
                    layout: 'noBorders',
                },
            ],
            defaultStyle: {
                alignment: 'justify',
                fontSize: 10
            }
        };

        var printer = new PdfPrinter(fonts);
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename));
        pdfDoc.end();
        docDefinition=null;
        callback('',filename);
    },

    SYVerificationCertificate : function(userId,secondYearDetails, instituteDetails, app_id, callback){
        var filename = app_id + "_" + instituteDetails.name + "_SecondYearVerificationCertificate.pdf";
        var qrcode_name = app_id + "_" + instituteDetails.name +"_SecondYearVerificationCertificate_qrcode.png";
        var url = serverUrl + "upload/transcript/"+userId;
        var file_Dir = FILE_LOCATION + 'public/upload/documents/'+ userId;
        var qrcode = file_Dir+"/"+qrcode_name;
        var currentDateTime = moment(new Date()).format("DD/MM/YYYY");
        var number = '11104';
        if (!fs.existsSync(file_Dir)){
            fs.mkdirSync(file_Dir);
        }
    
        var fonts = {
            Roboto: {
                normal: FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
                bold:FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
                italics: FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
                bolditalics: FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
              }
        };
    
        if(!fs.existsSync(qrcode)){
            QRCode.toFile(file_Dir+"/"+qrcode_name, url+"/"+filename, {
                color: {
                    dark: '#000000',  // Blue dots
                    light: '#FFFF' // Transparent background
                }
            }, function (err) {
                if (err) throw err
    
                qrcode = file_Dir+"/"+qrcode_name;
            })       
        }

        var PdfPrinter = require(NODEMODULE_LOCATION+'node_modules/pdfmake/src/printer');
        var docDefinition = {
            content: [
                {
                    style:{
                      fontSize: 8,
                      bold: false,
                      lineHeight : 1,
                      color : 'blue'
                    } ,
                    table: {
                      widths: [180,140,170],//[30,70,230,150],
                      headerRows: 1,
                      body: [
                        [{text:'Fax :(079)26302654',alignment:'left'},{rowSpan: 7,image: FILE_LOCATION + 'public/upload/profile_pic/gujaratUniversityLogo.png',fit: [70, 70],alignment:'left'},{text:'Fax :(079)26302654',alignment:'left'}],
                        [{text:'Telephone : 26301341-26300342-43,',alignment:'left'}, '',{text:'Telephone : 26301341-26300342-43,',alignment:'left'}],
                        [{text:'26300126',alignment:'left'}, '',{text:'26300126',alignment:'left'}],
                        [{text:'Telegram : UNIGUJARAT',alignment:'left'}, '',{text:'Telegram : UNIGUJARAT',alignment:'left'}], 
                        ['','',''],
                        ['','',''],
                        ['','',''],
                        ['','',''],
                        ['','',''],
                        [{text:'OFFICE OF THE GUJARAT UNIVERSITY',bold:true,alignment:'left'},{rowSpan: 2,text: 'GUJARAT UNIVERSITY', bold:true, fontsize : 14,alignment:'left'},{text:'OFFICE OF THE GUJARAT UNIVERSITY',bold:true,alignment:'left'}],
                        [{text:'POST BOX NO. 4010',alignment:'left'},'',{text:'POST BOX NO. 4010',alignment:'left'}],
                        [{text:'NAVARANGPURA,',alignment:'left'},{rowSpan: 2,text: 'GUJARAT UNIVERSITY', fontsize : 14,alignment:'left'},{text:'NAVARANGPURA,',alignment:'left'}],
                        [{text:'AHEMEDABAD',alignment:'left'},'',{text:'AHEMEDABAD',alignment:'left'}],
                        ['',{text: '(NAAC Accredited B++)', bold:true, fontsize : 12,alignment:'left'},{rowSpan : 2, text:'No. A : ' + number,alignment:'left'}],
                        ['',{text: 'www.gujaratuniversity.ac.in', bold:true,alignment:'left'},'']
                    ]
                    },
                    layout: 'noBorders',
                },
                {text:'________________________________________________________________________________________________________________________________',fontSize: 8,bold:true},
                {
                    style:{
                        fontSize: 9,
                        bold: false,
                        lineHeight : 1,
                    } ,
                    table: {
                        widths: [180,160,180],
                        headerRows: 0,
                        body: [
                            [{text:'No.Exam./4A/10301/2022',alignment: 'right'},'',{text:'Dated : ' + currentDateTime, alignment:'left'}],
                            ['','',''],
                            [{text:'To,',alignment: 'justify'},'',''],
                            [{text:'Ref. No. ' + instituteDetails.refNo,alignment: 'justify'},'',''],
                            [{text: instituteDetails.name,alignment: 'justify'},'',''],
                            [{text: instituteDetails.address,alignment: 'justify'},'',''],
                            ['','',''],
                        ]                        
                    },
                    layout: 'noBorders',
                },
                {text : 'Ref : Student\'s Application dated '+ secondYearDetails.applicationDate + ' of ' + secondYearDetails.collegeName + '.',fontsize:9, alignment :'center'},
                {text : 'Sir/Madam,',fontSize:9,bold:true, alignment :'left'},
                {text : 'This is to certify that ' + secondYearDetails.studentName + ' was a student of ' + secondYearDetails.collegeName + ' for ' + secondYearDetails.duration + ' Years of his/her graduation studies in the ' + secondYearDetails.faculty + ' faculty from ' + secondYearDetails.academicYear + '.',fontSize :9, alignment :'justify',leadingIndent: 40},
                {text : 'It is further certified that as per the Uiversity guidelines, the Second Year ' + secondYearDetails.courseName + ' Examination were conducted by the ' + secondYearDetails.collegeName + ' was affiliated to Gujarat University, so the Marksheet could only attested by Principal of this college.',fontSize :9, alignment :'justify',leadingIndent: 40},
                {text : secondYearDetails.studentName + ' has passed the Second Year ' + secondYearDetails.courseName + ' examination with ' + secondYearDetails.result + ' with ' + secondYearDetails.majorSubject + ' as his/her major subject and ' + secondYearDetails.subsidiarySubject + ' as his/her subsidiary subject, conducted by ' + secondYearDetails.collegeName + ' in ' + secondYearDetails.passingMonthYear + '.', fontSize : 9, alignment :'justify',leadingIndent: 40},
                {text : 'Also certified that '+ secondYearDetails.collegeName + ' is affiliated to the Gujarat University.',fontSize : 9, alignment :'justify',leadingIndent: 40},
                {
                    style:{
                        fontSize: 9,
                        bold: false,
                    } ,
                    table: {
                         widths: [180,160,180],
                        headerRows: 1,
                        body: [
                            [{rowSpan: 6,image: qrcode,fit: [60, 60],alignment:'left'},'',{text:'Yours faithfully', alignment:'left'}],
                            ['','',''],
                            ['','',''],
                            ['','',''],
                            ['','',{text : 'for Controller of Examinations.'}],
                            ['','','']
                        ]                        
                    },
                    layout: 'noBorders',
                },
            ],
            defaultStyle: {
                alignment: 'justify',
                fontSize: 10,
                pageSize: 'A4',
                lineHeight : 1.5
            }
        };
        setTimeout(()=>{
            var printer = new PdfPrinter(fonts);
            var pdfDoc = printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename));
            pdfDoc.end();
            docDefinition=null;
            callback('',filename);
        },2000)
    },

    merge : function(inputString,outputfile,callback){
        var command = "pdfunite "+inputString+ " " +outputfile;
        const pdfunite = exec(command, function (error, stdout, stderr) {
            if (error) {
              logger.error(error.stack);
              logger.error('Error code: '+error.code);
              logger.error('Signal received: '+error.signal);
            }else{
               callback();
            }
            logger.debug('Child Process STDOUT: '+stdout);
            logger.error('Child Process STDERR: '+stderr);
          });

          pdfunite.on('exit', function (code) {
            logger.debug('Child process exited with exit code '+code);
          });
    },

    applicationForm : function(marksheet,degree,transcript,file,userId,noMarksheet,noDegree,noTranscript,nosealedCover,app_id,secondyear,getorder,statuspayment,callback){
        var userId=userId;
        filename = app_id+"_ApplicationForm";
        var markshhetArray =[];
        var duration = converter.toWords(getorder[0].amount);
        var PaymentTime = moment(new Date(getorder[0].created_at)).format("DD-MM-YYYY hh:mm")      
          var file_Dir = FILE_LOCATION + '/public/upload/documents/'+ userId+'/';
        var gujartph=FILE_LOCATION+ 'public/upload/profile_pic/gujaratUniversityLogo.png';
        var date = moment().format('DD-MM-YYYY hh:mm:ss');
        // var file_Dir = constants.FILE_LOCATION+'public/certificate/'+user_id;
        // currentDateTime = moment(new Date()).format("DD/MM/YYYY");
        var fonts = {
            Roboto: {
                normal:FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
                bold: FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
                italics:FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
                bolditalics: FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf',
               
              }
        };

    
        var PdfPrinter = require(FILE_LOCATION+'node_modules/pdfmake/src/printer');
    


    var col1=[];
    var col2=[];
    var doc2 = file;


 var docDefinition = {
            pageSize: 'A4',
            content: [
                {text:"Application No :"+userId,alignment:'right'},
                {
                    table: {
                        widths: [500],
                        // headerRows: 1,
                        body:[
                            
                            [
                                {
                                    style:{
                                        fontSize: 10,
                                    },
                                    table: {
                                        widths: [50,360,'*'],
                                        body: [
                                            [{rowSpan:2,image: gujartph,fit: [50, 50],border: [false, false, false, false],alignment:'center'},{text:'GUJARAT UNIVERSITY',alignment:'left',bold:true,fontSize:18,border: [false, false, false, false]},{text:'',border: [false, false, false, false]}],
                                            [{text:'',border: [false, false, false, false]},{text:'Application Form for Marksheet/Degree/Transcript Verification/Sealed Cover/Second Year Marksheets',border: [false, false, false, false]},{text:'',alignment:'right',border: [false, false, false, false]}],
                                            [{border: [false, false, false, true],text:''},{text:noMarksheet+noDegree+noTranscript+nosealedCover+secondYear,border: [false, false, false, true]},{text:'',border: [false, false, false, true]}]
                                        ]
                                    
                                    },
                                    
                                    layout: {
                                        defaultBorder: true,
                                    }
                                }
                            ],
                            
                           
                        ]
                    },

                    layout: 'noBorders',
                },
                [
                    {
                        style:{
                            fontSize: 12,
                        },
                        table: {
                            widths: [150,'*'],
                            // headerRows: 1,
                            body: [
                                [{text: 'Payment Details', border: [false, true, false, true],colSpan: 2,alignment:'left',bold:true}, {}],
                                ['Payment Status', ':'+statuspayment],
                                ['Payment Time', ':'+PaymentTime],
                                ['Payment Amount', ': INR '+getorder[0].amount],
                                ['Payment Amount in words', ': '+duration+' rupess only'],
                            ]
                        },
                        layout: {
                            defaultBorder: false,
                        }
                    }
                   ],
                {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 1 }]},
                {text:'\nUploaded Documents List\n',bold:true,fontSize:10},
                {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 1 }]},
                ['\n'],
                [{ text: 'Sr.No.                       Document Name'}],
                file,
                
               
                
                [{text:' ',fontSize:10},{}],
                [{border: [false, false, false, true],text:'',fontSize:11},{border: [false, false, false, true],text:'',fontSize:11}],
                [{text:'Print Date: '+date,fontSize:10},{}],


              
            ],


            styles: {
                header: {
                    fontSize: 18,
                    bold: true
                },
                bigger: {
                    fontSize: 15,
                    italics: true
                }
            },
            defaultStyle: {
                alignment: 'justify',
                fontSize: 10,
                color:"black",
                columnGap: 20
            }
        };
        if(marksheet.personalDetails != '' && marksheet.eduDetails != ''){
           var mark_personal = [
                {
                    style:{
                        fontSize: 10,
                    },
                    table: {
                        widths: [150,'*'],
                        
                         body: marksheet.personalDetails
                    },
                    layout: {
                        defaultBorder: false,
                    }
                }
            ];
           docDefinition.content[1].table.body.push(mark_personal);
            var mark_educational = [
                {
                    style:{
                        fontSize: 10,
                    },
                    table: {
                        widths: [150,'*'],
                        
                         body: marksheet.eduDetails
                    },
                    layout: {
                        defaultBorder: false,
                    }
                }
            ]
            docDefinition.content[1].table.body.push(mark_educational);
        };
        if(degree.personalDetails != '' && degree.eduDetails != 0){
            var degree_personal = [
                 {
                     style:{
                         fontSize: 10,
                     },
                     table: {
                         widths: [150,'*'],
                        
                         body: degree.personalDetails
                     },
                     layout: {
                         defaultBorder: false,
                     }
                 }
             ];
            docDefinition.content[1].table.body.push(degree_personal);
             var degree_educational = [
                 {
                     style:{
                         fontSize: 10,
                     },
                     table: {
                         widths: [150,'*'],
                         
                          body: degree.eduDetails
                     },
                     layout: {
                         defaultBorder: false,
                     }
                 }
             ]
             docDefinition.content[1].table.body.push(degree_educational);
         };
         if(transcript.personalDetails != '' && transcript.eduDetails != 0){
         var transcript_personal = [
              {
                  style:{
                      fontSize: 10,
                  },
                  table: {
                      widths: [150,'*'],
                      
                      body: transcript.personalDetails
                  },
                  layout: {
                      defaultBorder: false,
                  }
              }
          ];
         docDefinition.content[1].table.body.push(transcript_personal);
          var transcript_educational = [
              {
                  style:{
                      fontSize: 10,
                  },
                  table: {
                      widths: [150,'*'],
                    
                       body: transcript.eduDetails
                  },
                  layout: {
                      defaultBorder: false,
                  }
              }
          ]
          docDefinition.content[1].table.body.push(transcript_educational);
      };
      if(secondyear.personalDetails != '' && transcript.eduDetails != 0){
        var secondyear_personal = [
             {
                 style:{
                     fontSize: 10,
                 },
                 table: {
                     widths: [150,'*'],
                     
                     body: secondyear.personalDetails
                 },
                 layout: {
                     defaultBorder: false,
                 }
             }
         ];
        docDefinition.content[1].table.body.push(secondyear_personal);
         var secondyear_educational = [
             {
                 style:{
                     fontSize: 10,
                 },
                 table: {
                     widths: [150,'*'],
                   
                      body: secondyear.eduDetails
                 },
                 layout: {
                     defaultBorder: false,
                 }
             }
         ]
         docDefinition.content[1].table.body.push(secondyear_educational);
     };

        var printer = new PdfPrinter(fonts);
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
        pdfDoc.end();
        docDefinition=null;
       callback();
    },

    generateQRCode : function(userId,documentType,instituteName,app_id,callback){
        var filename = app_id +"_" + instituteName +  "_" + documentType + "VerificationCertificate.pdf";
        var qrcode_name = app_id +"_" + instituteName +  "_" + documentType +"VerificationCertificate_qrcode.png"
        var qrcode;
         var file_Dir = FILE_LOCATION + '/public/upload/documents/'+ userId;
        var url = serverUrl + "upload/transcript/"+userId;
        if (!fs.existsSync(file_Dir)){
            fs.mkdirSync(file_Dir);
        }

        if(!fs.existsSync(file_Dir+"/"+qrcode_name)){
            QRCode.toFile(file_Dir+"/"+qrcode_name, url+"/"+filename, {
                color: {
                    dark: '#000000',  // Blue dots
                    light: '#FFFF' // Transparent background
                }
            }, function (err) {
                if (err) throw err

                qrcode = file_Dir+"/"+qrcode_name;
            })       
        }
    },

    generateAddress : function(userId, institute,app_id,section,callback){
        var filename = app_id +"_" + institute.name +  "_" + "address.pdf";
        var file_Dir = FILE_LOCATION + 'public/upload/documents/'+ userId;
        var A1 = (section=='A1') ? 'black' : 'white';
		var B1 = (section=='B1') ? 'black' : 'white';

        if (!fs.existsSync(file_Dir)){
            fs.mkdirSync(file_Dir);
        }

        var fonts = {
            Roboto: {
                normal: FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
                bold:FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
                italics: FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
                bolditalics: FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
            },
            TimesNewRoman: {
				normal: FILE_LOCATION+'public/fonts/pdf_fonts/times new roman.ttf',
				bold: FILE_LOCATION+'public/fonts/pdf_fonts/times new roman bold.ttf',
				italics: FILE_LOCATION+'public/fonts/pdf_fonts/times new roman italic.ttf',
				bolditalics: FILE_LOCATION+'public/fonts/pdf_fonts/times new roman bold italic.ttf'
			},
            
        };

        var PdfPrinter = require(NODEMODULE_LOCATION+'node_modules/pdfmake/src/printer');

        var docDefinition = {
            pageSize: 'A4',
            //pageOrientation: 'landscape',
            content: [
                {
                    table: {
                        widths: [500],
                        headerRows: 1,
                        body:[
                            ['\n\n\n\n\n\n'],
                            [
                                {
                                    style:{
                                        fontSize: 10,
                                    },
                                    table: {
                                        widths: [100,200,100],
                                        headerRows: 1,
                                        body: [
                                            ['',{text:''+institute.name, fontSize: 28, bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
                                            ['',{text:''+institute.address,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
                                            ['',{text:'',fontSize: 15, alignment:'left',color : A1, colSpan:2},''],
                                        ]
                                    },
                                    layout: 'noBorders',
                                }
                            ],
                            ['\n\n\n\n\n\n\n'],
                            [{
                                style:{
                                    fontSize: 10,
                                },
                                table: {
                                    widths: [100,200,100],
                                    headerRows: 1,
                                    body: [
                                        ['',{text:''+institute.name, fontSize: 28, bold:true, alignment:'left',color : B1, colSpan:2},''],
                                        ['',{text:''+institute.address,fontSize: 20 , bold:true, alignment:'left',color : B1, colSpan:2},''],
                                        ['',{text:'',fontSize: 15, alignment:'left',color : B1, colSpan:2},''],
                                    ]
                                },
                                layout: 'noBorders',
                            }],
                        ]
                    },
                    layout: 'noBorders',
                },
            ],
            defaultStyle: {
                alignment: 'justify',
                fontSize: 10,
                color:"black"
            }
        };

        var printer = new PdfPrinter(fonts);
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename));
        pdfDoc.end();
        docDefinition=null;
        callback('',filename);
    }
}