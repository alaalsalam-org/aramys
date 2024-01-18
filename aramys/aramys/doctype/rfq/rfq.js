// {% include "erpnext/selling/sales_common.js" %}
frappe.provide("aramys.rfq");

cur_frm.email_field = "contact_email";

const questions_values = {
    "q_1": 1,
    "q_2": 1,
    "q_3": 0.5,
    "q_4": 0.5,
    "q_5": 0.667,
    "q_6": 0.667,
    "q_7": 0.667,
    "q_8": 1,
    "q_9": 1,
    "q_10": 0.5,
    "q_11": 0.5,
    "q_12": 1,
    "q_13": 0.5,
    "q_14": 0.5,
    "q_15": 0.5,
    "q_16": 0.5,
    "q_17": 0.5,
    "q_18": 0.5,
    "q_19": 2,
    "q_20": 0.5,
    "q_21": 0.5
};

frappe.ui.form.on("RFQ", {
	set_lost_dialog: function(frm) {
		console.log(frm.doctype === 'Opportunity' ? 'Opportunity Lost Reason Detail': 'Quotation Lost Reason Detail');
		let dialog = new frappe.ui.Dialog({
			title: __("Set as Lost"),
			fields: [
			  	{
					"fieldtype": "Table MultiSelect",
					"label": __("Lost Reasons"),
					"fieldname": "lost_reason",
					"options": 'Opportunity Lost Reason Detail',
					"reqd": 1
				},
				{
					"fieldtype": "Table MultiSelect",
					"label": __("Competitors"),
					"fieldname": "competitors",
					"options": "Competitor Detail"
				},
				{
					"fieldtype": "Small Text",
					"label": __("Detailed Reason"),
					"fieldname": "detailed_reason"
				},
			],
			primary_action: function() {
				let values = dialog.get_values();

				frm.call({
					doc: frm.doc,
					method: 'declare_enquiry_lost',
					args: {
						'lost_reasons_list': values.lost_reason,
						'competitors': values.competitors ? values.competitors : [],
						'detailed_reason': values.detailed_reason
					},
					callback: function(r) {
						dialog.hide();
						frm.reload_doc();
					},
				});
			},
			primary_action_label: __('Declare Lost')
		  });

		dialog.show();
	},
	setup: function(frm) {
		// frm.custom_make_buttons = {
		// 	'Quotation': 'Quotation',
		// 	'Supplier Quotation': 'Supplier Quotation'
		// };

		frm.set_query("opportunity_from", function() {
			return{
				"filters": {
					"name": ["in", ["Customer", "Lead", "Prospect"]],
				}
			}
		});
	},

	validate: function(frm) {
		if (frm.doc.status == "Lost" && !frm.doc.lost_reasons.length) {
			frm.trigger('set_lost_dialog');
			frappe.throw(__("Lost Reasons are required in case opportunity is Lost."));
		}
	},

	onload_post_render: function(frm) {
		frm.get_field("items").grid.set_multiple_add("item_code", "qty");
	},

	// party_name: function(frm) {
	// 	frm.trigger('set_contact_link');

	// 	if (frm.doc.opportunity_from == "Customer") {
	// 		erpnext.utils.get_party_details(frm);
	// 	} else if (frm.doc.opportunity_from == "Lead") {
	// 		erpnext.utils.map_current_doc({
	// 			method: "erpnext.crm.doctype.lead.lead.make_opportunity",
	// 			source_name: frm.doc.party_name,
	// 			frm: frm
	// 		});
	// 	}
	// },

	onload_post_render: function(frm) {
		frm.get_field("items").grid.set_multiple_add("item_code", "qty");
	},

	status:function(frm){
		if (frm.doc.status == "Lost"){
			frm.trigger('set_lost_dialog');
		}

	},

	customer_address: function(frm, cdt, cdn) {
		erpnext.utils.get_address_display(frm, 'customer_address', 'address_display', false);
	},

	contact_person: erpnext.utils.get_contact_details,

	opportunity_from: function(frm) {
		frm.trigger('setup_opportunity_from');

		frm.set_value("party_name", "");
	},

	setup_opportunity_from: function(frm) {
		frm.trigger('setup_queries');
		frm.trigger("set_dynamic_field_label");
	},

	refresh: function(frm) {
		var doc = frm.doc;
		frm.trigger('setup_opportunity_from');
		erpnext.toggle_naming_series();

		if(!frm.is_new() && doc.status!=="Lost") {
			if(doc.items){
				frm.add_custom_button(__('Request for quotation- Bidding'),
					function() {
						frm.trigger("make_request_for_quotation")
					}, __('Create'));
			}frm.add_custom_button(__('Supplier Quotation'),
					function() {
						frm.trigger("make_supplier_quotation")
					}, __('Create'));

				

			if (frm.doc.opportunity_from != "Customer") {
				frm.add_custom_button(__('Customer'),
					function() {
						frm.trigger("make_customer")
					}, __('Create'));
			}

			frm.add_custom_button(__('Quotation to Customer'),
				function() {
					frm.trigger("create_quotation")
				}, __('Create'));
		}

		if(!frm.doc.__islocal && frm.perm[0].write && frm.doc.docstatus==0) {
			if(frm.doc.status==="Open") {
				frm.add_custom_button(__("Close"), function() {
					frm.set_value("status", "Closed");
					frm.save();
				});
			} else {
				frm.add_custom_button(__("Reopen"), function() {
					frm.set_value("lost_reasons",[])
					frm.set_value("status", "Open");
					frm.save();
				});
			}
		}

		if (!frm.is_new()) {
			frappe.contacts.render_address_and_contact(frm);
			// frm.trigger('render_contact_day_html');
		} else {
			frappe.contacts.clear_address_and_contact(frm);
		}

		if (frm.doc.opportunity_from && frm.doc.party_name) {
			frm.trigger('set_contact_link');
		}
        
	},

	set_contact_link: function(frm) {
		if(frm.doc.opportunity_from == "Customer" && frm.doc.party_name) {
			frappe.dynamic_link = {doc: frm.doc, fieldname: 'party_name', doctype: 'Customer'}
		} else if(frm.doc.opportunity_from == "Lead" && frm.doc.party_name) {
			frappe.dynamic_link = {doc: frm.doc, fieldname: 'party_name', doctype: 'Lead'}
		} else if (frm.doc.opportunity_from == "Prospect" && frm.doc.party_name) {
			frappe.dynamic_link = {doc: frm.doc, fieldname: 'party_name', doctype: 'Prospect'}
		}
	},

	currency: function(frm) {
		let company_currency = erpnext.get_currency(frm.doc.company);
		if (company_currency != frm.doc.company) {
			frappe.call({
				method: "erpnext.setup.utils.get_exchange_rate",
				args: {
					from_currency: frm.doc.currency,
					to_currency: company_currency
				},
				callback: function(r) {
					if (r.message) {
						frm.set_value('conversion_rate', flt(r.message));
						frm.set_df_property('conversion_rate', 'description', '1 ' + frm.doc.currency
						+ ' = [?] ' + company_currency);
					}
				}
			});
		} else {
			frm.set_value('conversion_rate', 1.0);
			frm.set_df_property('conversion_rate', 'hidden', 1);
			frm.set_df_property('conversion_rate', 'description', '');
		}

		frm.trigger('opportunity_amount');
		frm.trigger('set_dynamic_field_label');
	},

	opportunity_amount: function(frm) {
		frm.set_value('base_opportunity_amount', flt(frm.doc.opportunity_amount) * flt(frm.doc.conversion_rate));
	},

	set_dynamic_field_label: function(frm){
		if (frm.doc.opportunity_from) {
			frm.set_df_property("party_name", "label", frm.doc.opportunity_from);
		}
		frm.trigger('change_grid_labels');
		frm.trigger('change_form_labels');
	},

	make_supplier_quotation: function(frm) {
		frappe.model.open_mapped_doc({
			method: "aramys.aramys.doctype.rfq.rfq.make_supplier_quotation",
			frm: frm
		})
	},

	make_request_for_quotation: function(frm) {
		frappe.model.open_mapped_doc({
			method: "aramys.aramys.doctype.rfq.rfq.make_request_for_quotation",
			frm: frm
		})
	},

	change_form_labels: function(frm) {
		let company_currency = erpnext.get_currency(frm.doc.company);
		frm.set_currency_labels(["base_opportunity_amount", "base_total"], company_currency);
		frm.set_currency_labels(["opportunity_amount", "total"], frm.doc.currency);

		// toggle fields
		frm.toggle_display(["conversion_rate", "base_opportunity_amount", "base_total"],
			frm.doc.currency != company_currency);
	},

	change_grid_labels: function(frm) {
		let company_currency = erpnext.get_currency(frm.doc.company);
		frm.set_currency_labels(["base_rate", "base_amount"], company_currency, "items");
		frm.set_currency_labels(["rate", "amount"], frm.doc.currency, "items");

		let item_grid = frm.fields_dict.items.grid;
		$.each(["base_rate", "base_amount"], function(i, fname) {
			if(frappe.meta.get_docfield(item_grid.doctype, fname))
				item_grid.set_column_disp(fname, frm.doc.currency != company_currency);
		});
		frm.refresh_fields();
	},

	calculate_total: function(frm) {
		let total = 0, base_total = 0;
		frm.doc.items.forEach(item => {
			total += item.amount;
			base_total += item.base_amount;
		})

		frm.set_value({
			'total': flt(total),
			'base_total': flt(base_total)
		});
	},
    
    ...Object.keys(questions_values).reduce((acc, key) => {
        acc[key] = function(frm) {
            let total = frm.doc.test_1;
            if (frm.doc[key]) {
                total += questions_values[key];
                frm.set_value(`q__${key.slice(2)}`, questions_values[key]);
            }
            else{
                total -= questions_values[key];
                frm.set_value(`q__${key.slice(2)}`, 0);
        
            }
            console.log(questions_values[key], total);
            frm.set_value('test_1', total);
        };
        return acc;
    }, {})
});
frappe.ui.form.on("RFQ Item", {
	calculate: function(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "amount", flt(row.qty) * flt(row.rate));
		frappe.model.set_value(cdt, cdn, "base_rate", flt(frm.doc.conversion_rate) * flt(row.rate));
		frappe.model.set_value(cdt, cdn, "base_amount", flt(frm.doc.conversion_rate) * flt(row.amount));
		frm.trigger("calculate_total");
	},
	qty: function(frm, cdt, cdn) {
		frm.trigger("calculate", cdt, cdn);
	},
	rate: function(frm, cdt, cdn) {
		frm.trigger("calculate", cdt, cdn);
	}
})

aramys.rfq.Opportunity = class Opportunity extends frappe.ui.form.Controller {
	onload() {

		if(!this.frm.doc.status) {
			frm.set_value('status', 'Open');
		}
		if(!this.frm.doc.company && frappe.defaults.get_user_default("Company")) {
			frm.set_value('company', frappe.defaults.get_user_default("Company"));
		}
		if(!this.frm.doc.currency) {
			frm.set_value('currency', frappe.defaults.get_user_default("Currency"));
		}

		this.setup_queries();
		this.frm.trigger('currency');
	}

	refresh() {
		this.show_notes();
		this.show_activities();
	}

	setup_queries() {
		var me = this;

		me.frm.set_query('customer_address', erpnext.queries.address_query);

		this.frm.set_query("item_code", "items", function() {
			return {
				query: "erpnext.controllers.queries.item_query",
				filters: {'is_sales_item': 1}
			};
		});

		me.frm.set_query('contact_person', erpnext.queries['contact_query'])

		if (me.frm.doc.opportunity_from == "Lead") {
			me.frm.set_query('party_name', erpnext.queries['lead']);
		}
		else if (me.frm.doc.opportunity_from == "Customer") {
			me.frm.set_query('party_name', erpnext.queries['customer']);
		} else if (me.frm.doc.opportunity_from == "Prospect") {
			me.frm.set_query('party_name', function() {
				return {
					filters: {
						"company": me.frm.doc.company
					}
				};
			});
		}
	}

	create_quotation() {
		frappe.model.open_mapped_doc({
			method: "aramys.aramys.doctype.rfq.rfq.make_quotation",
			frm: cur_frm
		})
	}

	// make_customer() {
	// 	frappe.model.open_mapped_doc({
	// 		method: "erpnext.crm.doctype.opportunity.opportunity.make_customer",
	// 		frm: cur_frm
	// 	})
	// }

	show_notes() {
		const crm_notes = new erpnext.utils.CRMNotes({
			frm: this.frm,
			notes_wrapper: $(this.frm.fields_dict.notes_html.wrapper),
		});
		crm_notes.refresh();
	}

	show_activities() {
		const crm_activities = new erpnext.utils.CRMActivities({
			frm: this.frm,
			open_activities_wrapper: $(this.frm.fields_dict.open_activities_html.wrapper),
			all_activities_wrapper: $(this.frm.fields_dict.all_activities_html.wrapper),
			form_wrapper: $(this.frm.wrapper),
		});
		crm_activities.refresh();
	}
};

extend_cscript(cur_frm.cscript, new aramys.rfq.Opportunity({frm: cur_frm}));

// cur_frm.cscript.item_code = function(doc, cdt, cdn) {
// 	var d = locals[cdt][cdn];
// 	if (d.item_code) {
// 		return frappe.call({
// 			method: "erpnext.crm.doctype.opportunity.opportunity.get_item_details",
// 			args: {"item_code":d.item_code},
// 			callback: function(r, rt) {
// 				if(r.message) {
// 					$.each(r.message, function(k, v) {
// 						frappe.model.set_value(cdt, cdn, k, v);
// 					});
// 					refresh_field('image_view', d.name, 'items');
// 				}
// 			}
// 		})
// 	}
// }

frappe.ui.form.on('Tracking Record', {
	stage: (frm, cdt, cdn) => {
        const last_record = getLastTrackingRecord(frm.doc.tracking_record);
        if(last_record){
	  		frm.set_value('status', last_record.stage);  
		}

		frm.refresh_field('status');
	}
})

const getLastTrackingRecord = (childTable) => {
    if (childTable.length > 0) {
        childTable.sort(function(a, b) {
            return b.idx - a.idx;
        });
        return childTable[0];
    }
    return null;
}


cur_frm.cscript.item_code = function(doc, cdt, cdn) {
	var d = locals[cdt][cdn];
	if (d.item_code) {
		return frappe.call({
			method: "aramys.aramys.doctype.rfq.rfq.get_item_details",
			args: {"item_code":d.item_code},
			callback: function(r, rt) {
				console.log(rt, t);
				if(r.message) {
					$.each(r.message, function(k, v) {
						frappe.model.set_value(cdt, cdn, k, v);
					});
					refresh_field('image_view', d.name, 'items');
				}
			}
		})
	}
}