const pdfkit = require("pdfkit");
const fs = require("fs");

const company = require("../../resources/pdf/company");
const invoice = require("../../resources/pdf/invoice");

exports.pdf = {
    path: "public/invoices",
    doc: null, invoice: null,

    init(data, filename){
        this.doc = new pdfkit({size: invoice.style.size, margin: 50});
        this.path = `${this.path}/${filename}`;
        this.data = data;

        return this;
    },
    addHeader(){
        this.doc.image(company.logo, 50, 45, {width: 50}).fillColor(invoice.style.fillColor).fontSize(20).font(invoice.style.bold)
            .text(company.name, 110, 57).fontSize(10).font(invoice.style.font)
            .text(company.name, 200, 50, {align: "right"})
            .text(`${company.city}, ${company.street}`, 200, 65, {align: "right"})
            .text(`${company.city}, ${company.country}`, 200, 80, {align: "right"}).font(invoice.style.bold).moveDown();

        return this;
    },
    addCustomerDetails(){
        this.doc.fillColor(invoice.style.fillColor).fontSize(20).text(invoice.title, 50, 160);
        this.createLineBreak(this.doc, 185);
        const marginTop = 200;

        this.doc.fontSize(10).text(invoice.title, 50, marginTop).font(invoice.style.font)
            .text(this.data.invoice_nr, 150, marginTop).font(invoice.style.bold)
            .text(`${invoice.details.date}:`, 50, marginTop + 15).font(invoice.style.font)
            .text(this.formatDate(new Date()), 150, marginTop + 15).font(invoice.style.bold)
            .text(`${invoice.details.amount}:`, 50, marginTop + 30).font(invoice.style.font)
            .text(this.formatCurrency(this.data.subtotal - this.data.paid), 150, marginTop + 30)
            .text(this.data.shipping.name, 300, marginTop).font(invoice.style.font)
            .text(this.data.shipping.address, 300, marginTop + 15)
            .text(`${this.data.shipping.city}, ${this.data.shipping.state}, ${this.data.shipping.country}`, 300, marginTop + 30).moveDown();
            this.createLineBreak(this.doc, 252);

        return this;
    },
    createTable(){
        let at;
        const marginTop = 330;
        this.doc.font(invoice.style.bold);
        this.createTableRow(this.doc, marginTop, invoice.columns.courier, invoice.columns.from, invoice.columns.to, invoice.columns.price);
        this.createLineBreak(this.doc, marginTop + 20);
        this.doc.font(invoice.style.font);

        for (at = 0; at < this.data.items.length; at++) {
            const item = this.data.items[at];
            const position = marginTop + (at + 1) * 30;
            this.createTableRow(this.doc, position, item.item, item.description, this.formatCurrency(item.amount / item.quantity), this.formatCurrency(item.amount));
            this.createLineBreak(this.doc, position + 20);
        }

        this.doc.font(invoice.style.bold);
        this.createTableRow(this.doc, marginTop + (at + 1) * 30 + 20, "", "", invoice.columns.total, this.formatCurrency(this.data.subtotal - this.data.paid));
        this.doc.font(invoice.style.font);

        this.doc.end();
        this.doc.pipe(fs.createWriteStream(this.path));
    },
    createTableRow(doc, y, courier, from, to, lineTotal){
        return doc.fontSize(10).text(courier, 50, y).text(from, 150, y).text(to, 280, y, {width: 90, align: "right"}).text(lineTotal, 0, y, {align: "right"});
    },
    createLineBreak(doc, y) {
        return doc.strokeColor(invoice.style.lineColor).lineWidth(1).moveTo(50, y).lineTo(550, y).stroke()
    },
    formatDate (date) {
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
    },
    formatCurrency (cents) {
        return `${(cents / 100).toFixed(2)} ${invoice.currency}`
    }
};