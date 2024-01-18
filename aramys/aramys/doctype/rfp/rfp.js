// Copyright (c) 2023, NSFSS and contributors
// For license information, please see license.txt

frappe.ui.form.on('RFP', {
	refresh(frm) {
        refreshTotals(frm);
	}
})

frappe.ui.form.on('REF Details', {
	iv: (frm, cdt, cdn) => {
	    const invoiceValue = locals[cdt][cdn].iv;
	    let vat = locals[cdt][cdn].v;
	    if (vat === undefined){
	        vat = invoiceValue * 0.15;   
	    }
	    frappe.model.set_value(cdt, cdn, 'v', vat)
	    frm.refresh_field('v');
	},
	v: (frm, cdt, cdn) => {
	    const invoiceValue = locals[cdt][cdn].iv;
	    let vat = locals[cdt][cdn].v;
	    const total = invoiceValue + vat;
	    frappe.model.set_value(cdt, cdn, 'tic', total);
	    frm.refresh_field('tic');
	    refreshTotals(frm);
	}
})

function refreshTotals(frm){
	    let totalInvoice = 0;
	    let totalVat = 0;
	    let totalCost = 0;
	    $.each(frm.doc.details || [], (i, row) => {
	        totalInvoice += row.iv;
	        totalVat += row.v;
	        totalCost += row.tic;
	    })
	    frm.set_value('total_invoice', totalInvoice);
	    frm.refresh_field('total_invoice');
	    frm.set_value('vat', totalVat);
	    frm.refresh_field('vat');
	    frm.set_value('total_cost', totalCost);
	    frm.refresh_field('total_cost');
}