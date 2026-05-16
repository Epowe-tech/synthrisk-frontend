import { useState, useEffect, useRef } from "react";
import { getCurrentUser, fetchUserAttributes, signOut, fetchAuthSession } from "aws-amplify/auth";
import LoginPage from "./LoginPage.jsx";

const C = {
  bg: "#08090d",
  surface: "#0e1118",
  surfaceHigh: "#141720",
  border: "#1c2030",
  borderHigh: "#262d3f",
  text: "#e8eaf0",
  textMid: "#7a8299",
  textDim: "#3a4055",
  accent: "#3d8ef8",
  accentGlow: "rgba(61,142,248,0.12)",
  green: "#22c98a",
  amber: "#f5a623",
  red: "#ff5555",
};

// ── SEED DATA ─────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { id: 1, name: "ABC Plumbing", owner: "Demetri", renewal: "Oct 1", industry: "Plumbing & HVAC", naics: "238220", score: 6.4 },
  { id: 2, name: "Valley Cafe", owner: "Demetri", renewal: "Aug 15", industry: "Full-Service Restaurants", naics: "722511", score: 4.1 },
  { id: 3, name: "Alpha Roofing", owner: "Demetri", renewal: "Dec 10", industry: "Roofing Contractors", naics: "238160", score: 8.2 },
  { id: 4, name: "Apex Electric", owner: "Demetri", renewal: "Nov 3", industry: "Electrical Contractors", naics: "238210", score: 5.5 },
  { id: 5, name: "Desert Cafe", owner: "Sarah", renewal: "Sep 20", industry: "Full-Service Restaurants", naics: "722511", score: 3.9 },
  { id: 6, name: "Westside Gym", owner: "Demetri", renewal: "Oct 1", industry: "Fitness Centers", naics: "713940", score: 5.1 },
];

const SEED_PIPELINE = [
  { id: 1, account: "ABC Plumbing", stage: "Marketing", score: 6.4, premium: "$8,200", next: "Follow up market", accountId: 1 },
  { id: 2, account: "Alpha Roofing", stage: "Marketing", score: 8.2, premium: "$14,500", next: "Send to MGA", accountId: 3 },
  { id: 3, account: "Apex Electric", stage: "Quotes", score: 5.5, premium: "$6,800", next: "Review quotes", accountId: 4 },
  { id: 4, account: "Desert Cafe", stage: "Proposal", score: 3.9, premium: "$4,100", next: "Send proposal", accountId: 5 },
  { id: 5, account: "Westside Gym", stage: "Bound", score: 5.1, premium: "$5,900", next: "Issue policy", accountId: 6 },
];

const MARKETS_LIST = [
  { name: "Travelers", type: "Carrier", fit: "Strong", classes: ["Contractors", "Plumbing", "Restaurants", "Retail"], states: ["AZ", "CA", "TX"] },
  { name: "Liberty Mutual", type: "Carrier", fit: "Strong", classes: ["Contractors", "Manufacturing", "Electrical"], states: ["AZ", "NV", "CO"] },
  { name: "AmTrust MGA", type: "MGA", fit: "Moderate", classes: ["Restaurants", "Retail", "Fitness"], states: ["AZ", "CA"] },
  { name: "Markel Specialty", type: "MGA", fit: "Strong", classes: ["Roofing", "Excavation", "Site Preparation"], states: ["All"] },
  { name: "Berkley One", type: "Carrier", fit: "Moderate", classes: ["Healthcare", "Gyms", "Fitness"], states: ["CA", "TX"] },
  { name: "Employers Holdings", type: "Carrier", fit: "Strong", classes: ["Restaurants", "Retail", "Plumbing"], states: ["AZ", "NV", "TX"] },
  { name: "Kinsale Capital", type: "MGA", fit: "Strong", classes: ["Contractors", "Roofing", "Electrical"], states: ["All"] },
];

const NAICS_DATA = [
  { naics: "236115", industry: "New Single-Family Housing Construction (except For-Sale Builders)", category: "Construction", national_trc: 3.6, national_dart: 1.9 },
  { naics: "236116", industry: "New Multifamily Housing Construction (except For-Sale Builders)", category: "Construction", national_trc: 3.8, national_dart: 2.0 },
  { naics: "236117", industry: "New Housing For-Sale Builders", category: "Construction", national_trc: 3.6, national_dart: 1.9 },
  { naics: "236118", industry: "Residential Remodelers", category: "Construction", national_trc: 4.0, national_dart: 2.1 },
  { naics: "236210", industry: "Industrial Building Construction", category: "Construction", national_trc: 4.1, national_dart: 2.2 },
  { naics: "236220", industry: "Commercial and Institutional Building Construction", category: "Construction", national_trc: 3.9, national_dart: 2.1 },
  { naics: "237110", industry: "Water and Sewer Line and Related Structures Construction", category: "Construction", national_trc: 4.4, national_dart: 2.4 },
  { naics: "237120", industry: "Oil and Gas Pipeline and Related Structures Construction", category: "Construction", national_trc: 4.0, national_dart: 2.2 },
  { naics: "237130", industry: "Power and Communication Line and Related Structures Construction", category: "Construction", national_trc: 3.8, national_dart: 2.0 },
  { naics: "237210", industry: "Land Subdivision", category: "Construction", national_trc: 3.0, national_dart: 1.5 },
  { naics: "237310", industry: "Highway, Street, and Bridge Construction", category: "Construction", national_trc: 4.5, national_dart: 2.5 },
  { naics: "237990", industry: "Other Heavy and Civil Engineering Construction", category: "Construction", national_trc: 4.2, national_dart: 2.3 },
  { naics: "238110", industry: "Poured Concrete Foundation and Structure Contractors", category: "Construction", national_trc: 4.0, national_dart: 2.2 },
  { naics: "238120", industry: "Structural Steel and Precast Concrete Contractors", category: "Construction", national_trc: 4.6, national_dart: 2.5 },
  { naics: "238130", industry: "Framing Contractors", category: "Construction", national_trc: 4.7, national_dart: 2.5 },
  { naics: "238140", industry: "Masonry Contractors", category: "Construction", national_trc: 4.2, national_dart: 2.3 },
  { naics: "238150", industry: "Glass and Glazing Contractors", category: "Construction", national_trc: 3.5, national_dart: 1.8 },
  { naics: "238160", industry: "Roofing Contractors", category: "Construction", national_trc: 5.1, national_dart: 2.8 },
  { naics: "238170", industry: "Siding Contractors", category: "Construction", national_trc: 4.5, national_dart: 2.4 },
  { naics: "238190", industry: "Other Foundation, Structure, and Building Exterior Contractors", category: "Construction", national_trc: 4.3, national_dart: 2.3 },
  { naics: "238210", industry: "Electrical Contractors and Other Wiring Installation Contractors", category: "Construction", national_trc: 2.8, national_dart: 1.4 },
  { naics: "238220", industry: "Plumbing, Heating, and Air-Conditioning Contractors", category: "Construction", national_trc: 3.2, national_dart: 1.7 },
  { naics: "238290", industry: "Other Building Equipment Contractors", category: "Construction", national_trc: 3.5, national_dart: 1.8 },
  { naics: "238310", industry: "Drywall and Insulation Contractors", category: "Construction", national_trc: 3.0, national_dart: 1.5 },
  { naics: "238320", industry: "Painting and Wall Covering Contractors", category: "Construction", national_trc: 2.8, national_dart: 1.4 },
  { naics: "238330", industry: "Flooring Contractors", category: "Construction", national_trc: 3.2, national_dart: 1.6 },
  { naics: "238340", industry: "Tile and Terrazzo Contractors", category: "Construction", national_trc: 2.9, national_dart: 1.4 },
  { naics: "238350", industry: "Finish Carpentry Contractors", category: "Construction", national_trc: 3.0, national_dart: 1.5 },
  { naics: "238390", industry: "Other Building Finishing Contractors", category: "Construction", national_trc: 3.0, national_dart: 1.5 },
  { naics: "238910", industry: "Site Preparation Contractors", category: "Construction", national_trc: 4.2, national_dart: 2.3 },
  { naics: "238990", industry: "All Other Specialty Trade Contractors", category: "Construction", national_trc: 3.8, national_dart: 2.0 },
  { naics: "311111", industry: "Dog and Cat Food Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311119", industry: "Other Animal Food Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311211", industry: "Flour Milling", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311212", industry: "Rice Milling", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311213", industry: "Malt Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311221", industry: "Wet Corn Milling and Starch Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311224", industry: "Soybean and Other Oilseed Processing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311225", industry: "Fats and Oils Refining and Blending", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311230", industry: "Breakfast Cereal Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.5 },
  { naics: "311313", industry: "Beet Sugar Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "311314", industry: "Cane Sugar Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "311340", industry: "Nonchocolate Confectionery Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "311351", industry: "Chocolate and Confectionery Manufacturing from Cacao Beans", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "311352", industry: "Confectionery Manufacturing from Purchased Chocolate", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "311411", industry: "Frozen Fruit, Juice, and Vegetable Manufacturing", category: "Manufacturing", national_trc: 4.7, national_dart: 2.5 },
  { naics: "311412", industry: "Frozen Specialty Food Manufacturing", category: "Manufacturing", national_trc: 4.7, national_dart: 2.5 },
  { naics: "311421", industry: "Fruit and Vegetable Canning", category: "Manufacturing", national_trc: 4.7, national_dart: 2.5 },
  { naics: "311422", industry: "Specialty Canning", category: "Manufacturing", national_trc: 4.7, national_dart: 2.5 },
  { naics: "311423", industry: "Dried and Dehydrated Food Manufacturing", category: "Manufacturing", national_trc: 4.7, national_dart: 2.5 },
  { naics: "311511", industry: "Fluid Milk Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311512", industry: "Creamery Butter Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311513", industry: "Cheese Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311514", industry: "Dry, Condensed, and Evaporated Dairy Product Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311520", industry: "Ice Cream and Frozen Dessert Manufacturing", category: "Manufacturing", national_trc: 4.8, national_dart: 2.6 },
  { naics: "311611", industry: "Animal (except Poultry) Slaughtering", category: "Manufacturing", national_trc: 5.8, national_dart: 3.4 },
  { naics: "311612", industry: "Meat Processed from Carcasses", category: "Manufacturing", national_trc: 5.5, national_dart: 3.2 },
  { naics: "311613", industry: "Rendering and Meat Byproduct Processing", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "311615", industry: "Poultry Processing", category: "Manufacturing", national_trc: 5.6, national_dart: 3.3 },
  { naics: "311710", industry: "Seafood Product Preparation and Packaging", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "311811", industry: "Retail Bakeries", category: "Manufacturing", national_trc: 4.0, national_dart: 2.0 },
  { naics: "311812", industry: "Commercial Bakeries", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311813", industry: "Frozen Cakes, Pies, and Other Pastries Manufacturing", category: "Manufacturing", national_trc: 4.3, national_dart: 2.3 },
  { naics: "311821", industry: "Cookie and Cracker Manufacturing", category: "Manufacturing", national_trc: 4.3, national_dart: 2.3 },
  { naics: "311824", industry: "Dry Pasta, Dough, and Flour Mixes Manufacturing from Purchased Flour", category: "Manufacturing", national_trc: 4.3, national_dart: 2.3 },
  { naics: "311830", industry: "Tortilla Manufacturing", category: "Manufacturing", national_trc: 4.3, national_dart: 2.3 },
  { naics: "311911", industry: "Roasted Nuts and Peanut Butter Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311919", industry: "Other Snack Food Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311920", industry: "Coffee and Tea Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311930", industry: "Flavoring Syrup and Concentrate Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311941", industry: "Mayonnaise, Dressing, and Other Prepared Sauce Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311942", industry: "Spice and Extract Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311991", industry: "Perishable Prepared Food Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "311999", industry: "All Other Miscellaneous Food Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "312111", industry: "Soft Drink Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "312112", industry: "Bottled Water Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "312113", industry: "Ice Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "312120", industry: "Breweries", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "312130", industry: "Wineries", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "312140", industry: "Distilleries", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "312230", industry: "Tobacco Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.2 },
  { naics: "313110", industry: "Fiber, Yarn, and Thread Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "313210", industry: "Broadwoven Fabric Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "313220", industry: "Narrow Fabric Mills and Schiffli Machine Embroidery", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "313230", industry: "Nonwoven Fabric Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "313240", industry: "Knit Fabric Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "313310", industry: "Textile and Fabric Finishing Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "313320", industry: "Fabric Coating Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "314110", industry: "Carpet and Rug Mills", category: "Manufacturing", national_trc: 3.6, national_dart: 1.8 },
  { naics: "314120", industry: "Curtain and Linen Mills", category: "Manufacturing", national_trc: 3.6, national_dart: 1.8 },
  { naics: "314910", industry: "Textile Bag and Canvas Mills", category: "Manufacturing", national_trc: 3.6, national_dart: 1.8 },
  { naics: "314994", industry: "Rope, Cordage, Twine, Tire Cord, and Tire Fabric Mills", category: "Manufacturing", national_trc: 3.6, national_dart: 1.8 },
  { naics: "314999", industry: "All Other Miscellaneous Textile Product Mills", category: "Manufacturing", national_trc: 3.6, national_dart: 1.8 },
  { naics: "315120", industry: "Apparel Knitting Mills", category: "Manufacturing", national_trc: 2.5, national_dart: 1.2 },
  { naics: "315210", industry: "Cut and Sew Apparel Contractors", category: "Manufacturing", national_trc: 2.5, national_dart: 1.2 },
  { naics: "315250", industry: "Cut and Sew Apparel Manufacturing (except Contractors)", category: "Manufacturing", national_trc: 2.5, national_dart: 1.2 },
  { naics: "315990", industry: "Apparel Accessories and Other Apparel Manufacturing", category: "Manufacturing", national_trc: 2.5, national_dart: 1.2 },
  { naics: "316110", industry: "Leather and Hide Tanning and Finishing", category: "Manufacturing", national_trc: 3.0, national_dart: 1.4 },
  { naics: "316210", industry: "Footwear Manufacturing", category: "Manufacturing", national_trc: 3.0, national_dart: 1.4 },
  { naics: "316990", industry: "Other Leather and Allied Product Manufacturing", category: "Manufacturing", national_trc: 3.0, national_dart: 1.4 },
  { naics: "321113", industry: "Sawmills", category: "Manufacturing", national_trc: 5.5, national_dart: 3.0 },
  { naics: "321114", industry: "Wood Preservation", category: "Manufacturing", national_trc: 5.5, national_dart: 3.0 },
  { naics: "321211", industry: "Hardwood Veneer and Plywood Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321212", industry: "Softwood Veneer and Plywood Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321215", industry: "Engineered Wood Member Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321219", industry: "Reconstituted Wood Product Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321911", industry: "Wood Window and Door Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321912", industry: "Cut Stock, Resawing Lumber, and Planing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321918", industry: "Other Millwork (including Flooring)", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321920", industry: "Wood Container and Pallet Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321991", industry: "Manufactured Home (Mobile Home) Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321992", industry: "Prefabricated Wood Building Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "321999", industry: "All Other Miscellaneous Wood Product Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "322110", industry: "Pulp Mills", category: "Manufacturing", national_trc: 4.0, national_dart: 2.0 },
  { naics: "322120", industry: "Paper Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322130", industry: "Paperboard Mills", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322211", industry: "Corrugated and Solid Fiber Box Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322212", industry: "Folding Paperboard Box Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322219", industry: "Other Paperboard Container Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322220", industry: "Paper Bag and Coated and Treated Paper Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322230", industry: "Stationery Product Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322291", industry: "Sanitary Paper Product Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "322299", industry: "All Other Converted Paper Product Manufacturing", category: "Manufacturing", national_trc: 3.4, national_dart: 1.7 },
  { naics: "323111", industry: "Commercial Printing (except Screen and Books)", category: "Manufacturing", national_trc: 2.5, national_dart: 1.0 },
  { naics: "323113", industry: "Commercial Screen Printing", category: "Manufacturing", national_trc: 2.5, national_dart: 1.0 },
  { naics: "323117", industry: "Books Printing", category: "Manufacturing", national_trc: 2.5, national_dart: 1.0 },
  { naics: "323120", industry: "Support Activities for Printing", category: "Manufacturing", national_trc: 2.5, national_dart: 1.0 },
  { naics: "324110", industry: "Petroleum Refineries", category: "Manufacturing", national_trc: 1.6, national_dart: 0.7 },
  { naics: "324121", industry: "Asphalt Paving Mixture and Block Manufacturing", category: "Manufacturing", national_trc: 1.6, national_dart: 0.7 },
  { naics: "324122", industry: "Asphalt Shingle and Coating Materials Manufacturing", category: "Manufacturing", national_trc: 1.6, national_dart: 0.7 },
  { naics: "324191", industry: "Petroleum Lubricating Oil and Grease Manufacturing", category: "Manufacturing", national_trc: 1.6, national_dart: 0.7 },
  { naics: "324199", industry: "All Other Petroleum and Coal Products Manufacturing", category: "Manufacturing", national_trc: 1.6, national_dart: 0.7 },
  { naics: "325110", industry: "Petrochemical Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325120", industry: "Industrial Gas Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325130", industry: "Synthetic Dye and Pigment Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325180", industry: "Other Basic Inorganic Chemical Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325193", industry: "Ethyl Alcohol Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325194", industry: "Cyclic Crude, Intermediate, and Gum and Wood Chemical Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325199", industry: "All Other Basic Organic Chemical Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325211", industry: "Plastics Material and Resin Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325212", industry: "Synthetic Rubber Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325220", industry: "Artificial and Synthetic Fibers and Filaments Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325311", industry: "Nitrogenous Fertilizer Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325312", industry: "Phosphatic Fertilizer Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325314", industry: "Fertilizer (Mixing Only) Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325315", industry: "Compost Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325320", industry: "Pesticide and Other Agricultural Chemical Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325411", industry: "Medicinal and Botanical Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325412", industry: "Pharmaceutical Preparation Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325413", industry: "In-Vitro Diagnostic Substance Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325414", industry: "Biological Product (except Diagnostic) Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325510", industry: "Paint and Coating Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325520", industry: "Adhesive Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325611", industry: "Soap and Other Detergent Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325612", industry: "Polish and Other Sanitation Good Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325613", industry: "Surface Active Agent Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325620", industry: "Toilet Preparation Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325910", industry: "Printing Ink Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325920", industry: "Explosives Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325991", industry: "Custom Compounding of Purchased Resins", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325992", industry: "Photographic Film, Paper, Plate, Chemical, and Copy Toner Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "325998", industry: "All Other Miscellaneous Chemical Product and Preparation Manufacturing", category: "Manufacturing", national_trc: 2.0, national_dart: 0.9 },
  { naics: "326111", industry: "Plastics Bag and Pouch Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326112", industry: "Plastics Packaging Film and Sheet (including Laminated) Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326113", industry: "Unlaminated Plastics Film and Sheet (except Packaging) Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326121", industry: "Unlaminated Plastics Profile Shape Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326122", industry: "Plastics Pipe and Pipe Fitting Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326130", industry: "Laminated Plastics Plate, Sheet (except Packaging), and Shape Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326140", industry: "Polystyrene Foam Product Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326150", industry: "Urethane and Other Foam Product (except Polystyrene) Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326160", industry: "Plastics Bottle Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326191", industry: "Plastics Plumbing Fixture Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326199", industry: "All Other Plastics Product Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326211", industry: "Tire Manufacturing (except Retreading)", category: "Manufacturing", national_trc: 5.0, national_dart: 2.7 },
  { naics: "326212", industry: "Tire Retreading", category: "Manufacturing", national_trc: 5.0, national_dart: 2.7 },
  { naics: "326220", industry: "Rubber and Plastics Hoses and Belting Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326291", industry: "Rubber Product Manufacturing for Mechanical Use", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "326299", industry: "All Other Rubber Product Manufacturing", category: "Manufacturing", national_trc: 4.0, national_dart: 2.1 },
  { naics: "327110", industry: "Pottery, Ceramics, and Plumbing Fixture Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327120", industry: "Clay Building Material and Refractories Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327211", industry: "Flat Glass Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327212", industry: "Other Pressed and Blown Glass and Glassware Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327213", industry: "Glass Container Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327215", industry: "Glass Product Manufacturing Made of Purchased Glass", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327310", industry: "Cement Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "327320", industry: "Ready-Mix Concrete Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.5 },
  { naics: "327331", industry: "Concrete Block and Brick Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327332", industry: "Concrete Pipe Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327390", industry: "Other Concrete Product Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327410", industry: "Lime Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327420", industry: "Gypsum Product Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327910", industry: "Abrasive Product Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327991", industry: "Cut Stone and Stone Product Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327992", industry: "Ground or Treated Mineral and Earth Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327993", industry: "Mineral Wool Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "327999", industry: "All Other Miscellaneous Nonmetallic Mineral Product Manufacturing", category: "Manufacturing", national_trc: 3.8, national_dart: 2.0 },
  { naics: "331110", industry: "Iron and Steel Mills and Ferroalloy Manufacturing", category: "Manufacturing", national_trc: 5.5, national_dart: 3.0 },
  { naics: "331210", industry: "Iron and Steel Pipe and Tube Manufacturing from Purchased Steel", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331221", industry: "Rolled Steel Shape Manufacturing", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331222", industry: "Steel Wire Drawing", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331313", industry: "Alumina Refining and Primary Aluminum Production", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331314", industry: "Secondary Smelting and Alloying of Aluminum", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331315", industry: "Aluminum Sheet, Plate, and Foil Manufacturing", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331318", industry: "Other Aluminum Rolling, Drawing, and Extruding", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331410", industry: "Nonferrous Metal (except Aluminum) Smelting and Refining", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331420", industry: "Copper Rolling, Drawing, Extruding, and Alloying", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331491", industry: "Nonferrous Metal (except Copper and Aluminum) Rolling, Drawing, and Extruding", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331492", industry: "Secondary Smelting, Refining, and Alloying of Nonferrous Metal (except Copper and Aluminum)", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331511", industry: "Iron Foundries", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331512", industry: "Steel Investment Foundries", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331513", industry: "Steel Foundries (except Investment)", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331523", industry: "Nonferrous Metal Die-Casting Foundries", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331524", industry: "Aluminum Foundries (except Die-Casting)", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "331529", industry: "Other Nonferrous Metal Foundries (except Die-Casting)", category: "Manufacturing", national_trc: 5.0, national_dart: 2.8 },
  { naics: "332111", industry: "Iron and Steel Forging", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332112", industry: "Nonferrous Forging", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332114", industry: "Custom Roll Forming", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332117", industry: "Powder Metallurgy Part Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332119", industry: "Metal Crown, Closure, and Other Metal Stamping (except Automotive)", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332215", industry: "Metal Kitchen Cookware, Utensil, Cutlery, and Flatware (except Precious) Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332216", industry: "Saw Blade and Handtool Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332311", industry: "Prefabricated Metal Building and Component Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332312", industry: "Fabricated Structural Metal Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332313", industry: "Plate Work Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332321", industry: "Metal Window and Door Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332322", industry: "Sheet Metal Work Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332323", industry: "Ornamental and Architectural Metal Work Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332410", industry: "Power Boiler and Heat Exchanger Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332420", industry: "Metal Tank (Heavy Gauge) Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332431", industry: "Metal Can Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332439", industry: "Other Metal Container Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332510", industry: "Hardware Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332613", industry: "Spring Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332618", industry: "Other Fabricated Wire Product Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332710", industry: "Machine Shops", category: "Manufacturing", national_trc: 4.0, national_dart: 2.0 },
  { naics: "332721", industry: "Precision Turned Product Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332722", industry: "Bolt, Nut, Screw, Rivet, and Washer Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332811", industry: "Metal Heat Treating", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "332812", industry: "Metal Coating, Engraving (except Jewelry and Silverware), and Allied Services to Manufacturers", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332813", industry: "Electroplating, Plating, Polishing, Anodizing, and Coloring", category: "Manufacturing", national_trc: 4.2, national_dart: 2.2 },
  { naics: "332911", industry: "Industrial Valve Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332912", industry: "Fluid Power Valve and Hose Fitting Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332913", industry: "Plumbing Fixture Fitting and Trim Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332919", industry: "Other Metal Valve and Pipe Fitting Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332991", industry: "Ball and Roller Bearing Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332992", industry: "Small Arms Ammunition Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332993", industry: "Ammunition (except Small Arms) Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332994", industry: "Small Arms, Ordnance, and Ordnance Accessories Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332996", industry: "Fabricated Pipe and Pipe Fitting Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "332999", industry: "All Other Miscellaneous Fabricated Metal Product Manufacturing", category: "Manufacturing", national_trc: 4.1, national_dart: 2.1 },
  { naics: "333111", industry: "Farm Machinery and Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333112", industry: "Lawn and Garden Tractor and Home Lawn and Garden Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333120", industry: "Construction Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333131", industry: "Mining Machinery and Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333132", industry: "Oil and Gas Field Machinery and Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333241", industry: "Food Product Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333242", industry: "Semiconductor Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333243", industry: "Sawmill, Woodworking, and Paper Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333248", industry: "All Other Industrial Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333310", industry: "Commercial and Service Industry Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333413", industry: "Industrial and Commercial Fan and Blower and Air Purification Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333414", industry: "Heating Equipment (except Warm Air Furnaces) Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333415", industry: "Air-Conditioning and Warm Air Heating Equipment and Commercial and Industrial Refrigeration Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333511", industry: "Industrial Mold Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333514", industry: "Special Die and Tool, Die Set, Jig, and Fixture Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333515", industry: "Cutting Tool and Machine Tool Accessory Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333517", industry: "Machine Tool Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333519", industry: "Rolling Mill and Other Metalworking Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333611", industry: "Turbine and Turbine Generator Set Units Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333612", industry: "Speed Changer, Industrial High-Speed Drive, and Gear Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333613", industry: "Mechanical Power Transmission Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333618", industry: "Other Engine Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333912", industry: "Air and Gas Compressor Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333914", industry: "Measuring, Dispensing, and Other Pumping Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333921", industry: "Elevator and Moving Stairway Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333922", industry: "Conveyor and Conveying Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333923", industry: "Overhead Traveling Crane, Hoist, and Monorail System Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333924", industry: "Industrial Truck, Tractor, Trailer, and Stacker Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333991", industry: "Power-Driven Handtool Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333992", industry: "Welding and Soldering Equipment Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333993", industry: "Packaging Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333994", industry: "Industrial Process Furnace and Oven Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333995", industry: "Fluid Power Cylinder and Actuator Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333996", industry: "Fluid Power Pump and Motor Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "333998", industry: "All Other Miscellaneous General Purpose Machinery Manufacturing", category: "Manufacturing", national_trc: 3.2, national_dart: 1.5 },
  { naics: "334111", industry: "Electronic Computer Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334112", industry: "Computer Storage Device Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334118", industry: "Computer Terminal and Other Computer Peripheral Equipment Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334210", industry: "Telephone Apparatus Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334220", industry: "Radio and Television Broadcasting and Wireless Communications Equipment Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334290", industry: "Other Communications Equipment Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334310", industry: "Audio and Video Equipment Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334412", industry: "Bare Printed Circuit Board Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334413", industry: "Semiconductor and Related Device Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334416", industry: "Capacitor, Resistor, Coil, Transformer, and Other Inductor Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334417", industry: "Electronic Connector Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334418", industry: "Printed Circuit Assembly (Electronic Assembly) Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334419", industry: "Other Electronic Component Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334510", industry: "Electromedical and Electrotherapeutic Apparatus Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334511", industry: "Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334512", industry: "Automatic Environmental Control Manufacturing for Residential, Commercial, and Appliance Use", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334513", industry: "Instruments and Related Products Manufacturing for Measuring, Displaying, and Controlling Industrial Process Variables", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334514", industry: "Totalizing Fluid Meter and Counting Device Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334515", industry: "Instrument Manufacturing for Measuring and Testing Electricity and Electrical Signals", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334516", industry: "Analytical Laboratory Instrument Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334517", industry: "Irradiation Apparatus Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334519", industry: "Other Measuring and Controlling Device Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "334610", industry: "Manufacturing and Reproducing Magnetic and Optical Media", category: "Manufacturing", national_trc: 1.8, national_dart: 0.9 },
  { naics: "335131", industry: "Residential Electric Lighting Fixture Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335132", industry: "Commercial, Industrial, and Institutional Electric Lighting Fixture Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335139", industry: "Electric Lamp Bulb and Other Lighting Equipment Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335210", industry: "Small Electrical Appliance Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335220", industry: "Major Household Appliance Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335311", industry: "Power, Distribution, and Specialty Transformer Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335312", industry: "Motor and Generator Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335313", industry: "Switchgear and Switchboard Apparatus Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335314", industry: "Relay and Industrial Control Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335910", industry: "Battery Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335921", industry: "Fiber Optic Cable Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335929", industry: "Other Communication and Energy Wire Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335931", industry: "Current-Carrying Wiring Device Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335932", industry: "Noncurrent-Carrying Wiring Device Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335991", industry: "Carbon and Graphite Product Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "335999", industry: "All Other Miscellaneous Electrical Equipment and Component Manufacturing", category: "Manufacturing", national_trc: 2.6, national_dart: 1.2 },
  { naics: "336110", industry: "Automobile and Light Duty Motor Vehicle Manufacturing", category: "Manufacturing", national_trc: 5.5, national_dart: 2.8 },
  { naics: "336120", industry: "Heavy Duty Truck Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336211", industry: "Motor Vehicle Body Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336212", industry: "Truck Trailer Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336213", industry: "Motor Home Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336214", industry: "Travel Trailer and Camper Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336310", industry: "Motor Vehicle Gasoline Engine and Engine Parts Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336320", industry: "Motor Vehicle Electrical and Electronic Equipment Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336330", industry: "Motor Vehicle Steering and Suspension Components (except Spring) Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336340", industry: "Motor Vehicle Brake System Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336350", industry: "Motor Vehicle Transmission and Power Train Parts Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336360", industry: "Motor Vehicle Seating and Interior Trim Manufacturing", category: "Manufacturing", national_trc: 5.0, national_dart: 2.5 },
  { naics: "336370", industry: "Motor Vehicle Metal Stamping", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336390", industry: "Other Motor Vehicle Parts Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336411", industry: "Aircraft Manufacturing", category: "Manufacturing", national_trc: 4.2, national_dart: 2.0 },
  { naics: "336412", industry: "Aircraft Engine and Engine Parts Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336413", industry: "Other Aircraft Parts and Auxiliary Equipment Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336414", industry: "Guided Missile and Space Vehicle Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336415", industry: "Guided Missile and Space Vehicle Propulsion Unit and Propulsion Unit Parts Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336419", industry: "Other Guided Missile and Space Vehicle Parts and Auxiliary Equipment Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336510", industry: "Railroad Rolling Stock Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336611", industry: "Ship Building and Repairing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336612", industry: "Boat Building", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336991", industry: "Motorcycle, Bicycle, and Parts Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336992", industry: "Military Armored Vehicle, Tank, and Tank Component Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "336999", industry: "All Other Transportation Equipment Manufacturing", category: "Manufacturing", national_trc: 4.6, national_dart: 2.4 },
  { naics: "337110", industry: "Wood Kitchen Cabinet and Countertop Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337121", industry: "Upholstered Household Furniture Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337122", industry: "Nonupholstered Wood Household Furniture Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337126", industry: "Household Furniture (except Wood and Upholstered) Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337127", industry: "Institutional Furniture Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337211", industry: "Wood Office Furniture Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337212", industry: "Custom Architectural Woodwork and Millwork Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337214", industry: "Office Furniture (except Wood) Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337215", industry: "Showcase, Partition, Shelving, and Locker Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337910", industry: "Mattress Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "337920", industry: "Blind and Shade Manufacturing", category: "Manufacturing", national_trc: 4.5, national_dart: 2.4 },
  { naics: "339112", industry: "Surgical and Medical Instrument Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.8 },
  { naics: "339113", industry: "Surgical Appliance and Supplies Manufacturing", category: "Manufacturing", national_trc: 1.8, national_dart: 0.8 },
  { naics: "339114", industry: "Dental Equipment and Supplies Manufacturing", category: "Manufacturing", national_trc: 1.5, national_dart: 0.7 },
  { naics: "339115", industry: "Ophthalmic Goods Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339116", industry: "Dental Laboratories", category: "Manufacturing", national_trc: 1.5, national_dart: 0.7 },
  { naics: "339910", industry: "Jewelry and Silverware Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339920", industry: "Sporting and Athletic Goods Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339930", industry: "Doll, Toy, and Game Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339940", industry: "Office Supplies (except Paper) Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339950", industry: "Sign Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339991", industry: "Gasket, Packing, and Sealing Device Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339992", industry: "Musical Instrument Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339993", industry: "Fastener, Button, Needle, and Pin Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339994", industry: "Broom, Brush, and Mop Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339995", industry: "Burial Casket Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "339999", industry: "All Other Miscellaneous Manufacturing", category: "Manufacturing", national_trc: 2.4, national_dart: 1.0 },
  { naics: "531110", industry: "Lessors of Residential Buildings and Dwellings", category: "Real Estate", national_trc: 1.6, national_dart: 0.8 },
  { naics: "531120", industry: "Lessors of Nonresidential Buildings (except Miniwarehouses)", category: "Real Estate", national_trc: 1.8, national_dart: 0.9 },
  { naics: "531130", industry: "Lessors of Miniwarehouses and Self-Storage Units", category: "Real Estate", national_trc: 2.0, national_dart: 1.0 },
  { naics: "531190", industry: "Lessors of Other Real Estate Property", category: "Real Estate", national_trc: 1.8, national_dart: 0.9 },
  { naics: "531210", industry: "Offices of Real Estate Agents and Brokers", category: "Real Estate", national_trc: 0.6, national_dart: 0.3 },
  { naics: "531311", industry: "Residential Property Managers", category: "Real Estate", national_trc: 1.4, national_dart: 0.7 },
  { naics: "531312", industry: "Nonresidential Property Managers", category: "Real Estate", national_trc: 1.6, national_dart: 0.8 },
  { naics: "531320", industry: "Offices of Real Estate Appraisers", category: "Real Estate", national_trc: 0.6, national_dart: 0.3 },
  { naics: "531390", industry: "Other Activities Related to Real Estate", category: "Real Estate", national_trc: 1.2, national_dart: 0.6 },
  { naics: "532111", industry: "Passenger Car Rental", category: "Real Estate", national_trc: 2.5, national_dart: 1.2 },
  { naics: "532112", industry: "Passenger Car Leasing", category: "Real Estate", national_trc: 2.0, national_dart: 1.0 },
  { naics: "532120", industry: "Truck, Utility Trailer, and RV (Recreational Vehicle) Rental and Leasing", category: "Real Estate", national_trc: 3.5, national_dart: 1.8 },
  { naics: "532210", industry: "Consumer Electronics and Appliances Rental", category: "Real Estate", national_trc: 2.5, national_dart: 1.2 },
  { naics: "532281", industry: "Formal Wear and Costume Rental", category: "Real Estate", national_trc: 1.8, national_dart: 0.9 },
  { naics: "532282", industry: "Video Tape and Disc Rental", category: "Real Estate", national_trc: 1.5, national_dart: 0.7 },
  { naics: "532283", industry: "Home Health Equipment Rental", category: "Real Estate", national_trc: 2.5, national_dart: 1.2 },
  { naics: "532284", industry: "Recreational Goods Rental", category: "Real Estate", national_trc: 2.8, national_dart: 1.4 },
  { naics: "532289", industry: "All Other Consumer Goods Rental", category: "Real Estate", national_trc: 2.5, national_dart: 1.2 },
  { naics: "532310", industry: "General Rental Centers", category: "Real Estate", national_trc: 3.0, national_dart: 1.5 },
  { naics: "532411", industry: "Commercial Air, Rail, and Water Transportation Equipment Rental and Leasing", category: "Real Estate", national_trc: 3.5, national_dart: 1.8 },
  { naics: "532412", industry: "Construction, Mining, and Forestry Machinery and Equipment Rental and Leasing", category: "Real Estate", national_trc: 4.0, national_dart: 2.0 },
  { naics: "532420", industry: "Office Machinery and Equipment Rental and Leasing", category: "Real Estate", national_trc: 2.0, national_dart: 1.0 },
  { naics: "532490", industry: "Other Commercial and Industrial Machinery and Equipment Rental and Leasing", category: "Real Estate", national_trc: 3.0, national_dart: 1.5 },
  { naics: "533110", industry: "Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)", category: "Real Estate", national_trc: 0.4, national_dart: 0.2 },
  { naics: "721110", industry: "Hotels (except Casino Hotels) and Motels", category: "Hospitality", national_trc: 4.0, national_dart: 2.0 },
  { naics: "721120", industry: "Casino Hotels", category: "Hospitality", national_trc: 4.2, national_dart: 2.1 },
  { naics: "721191", industry: "Bed-and-Breakfast Inns", category: "Hospitality", national_trc: 3.5, national_dart: 1.7 },
  { naics: "721199", industry: "All Other Traveler Accommodation", category: "Hospitality", national_trc: 3.8, national_dart: 1.9 },
  { naics: "721211", industry: "RV (Recreational Vehicle) Parks and Campgrounds", category: "Hospitality", national_trc: 4.5, national_dart: 2.3 },
  { naics: "721214", industry: "Recreational and Vacation Camps (except Campgrounds)", category: "Hospitality", national_trc: 4.5, national_dart: 2.3 },
  { naics: "721310", industry: "Rooming and Boarding Houses, Dormitories, and Workers' Camps", category: "Hospitality", national_trc: 4.0, national_dart: 2.0 },
  { naics: "722310", industry: "Food Service Contractors", category: "Hospitality", national_trc: 4.5, national_dart: 2.2 },
  { naics: "722320", industry: "Caterers", category: "Hospitality", national_trc: 4.3, national_dart: 2.1 },
  { naics: "722330", industry: "Mobile Food Services", category: "Hospitality", national_trc: 4.0, national_dart: 2.0 },
  { naics: "722410", industry: "Drinking Places (Alcoholic Beverages)", category: "Hospitality", national_trc: 3.8, national_dart: 1.7 },
  { naics: "722511", industry: "Full-Service Restaurants", category: "Hospitality", national_trc: 4.1, national_dart: 1.9 },
  { naics: "722513", industry: "Limited-Service Restaurants", category: "Hospitality", national_trc: 4.3, national_dart: 2.0 },
  { naics: "722514", industry: "Cafeterias, Grill Buffets, and Buffets", category: "Hospitality", national_trc: 4.4, national_dart: 2.1 },
  { naics: "722515", industry: "Snack and Nonalcoholic Beverage Bars", category: "Hospitality", national_trc: 3.8, national_dart: 1.7 },
];

// ── NAICS HELPERS ─────────────────────────────────────────────────
const NAICS_BY_CODE = NAICS_DATA.reduce((acc, e) => { acc[e.naics] = e; return acc; }, {});
function getNAICSEntry(code) { return NAICS_BY_CODE[code] || null; }

// ── LEGACY DRAFT MIGRATION ────────────────────────────────────────
// Drafts saved before the spreadsheet expansion used `naicsIdx` (array index)
// pointing at a 10-entry NAICS_DATA. Map those indices back to NAICS codes.
// Indices 6-9 (Fitness, Warehousing, Trucking, Medical) aren't in the new
// 416-code dataset — those drafts will need the user to re-pick a NAICS.
const LEGACY_NAICS_INDEX_MAP = {
  "0": "238160",  // Roofing Contractors
  "1": "236220",  // Commercial Building Construction
  "2": "238210",  // Electrical Contractors
  "3": "238220",  // Plumbing & HVAC
  "4": "238910",  // Site Preparation
  "5": "722511",  // Full-Service Restaurants
  // "6": Fitness Centers — not in new dataset
  // "7": Warehousing & Storage — not in new dataset
  // "8": General Freight Trucking — not in new dataset
  // "9": Medical Offices — not in new dataset
};

function migrateLegacyDraft(draft) {
  if (!draft || typeof draft !== "object") return draft;

  // Already on new schema — leave alone.
  if (draft.naicsCode !== undefined || draft.naicsIdx === undefined) {
    return draft;
  }

  const idxKey = String(draft.naicsIdx);
  const mappedCode = LEGACY_NAICS_INDEX_MAP[idxKey];
  const migrated = { ...draft };
  delete migrated.naicsIdx;

  if (mappedCode && getNAICSEntry(mappedCode)) {
    migrated.naicsCode = mappedCode;
    migrated.naicsCategory = getNAICSEntry(mappedCode).category;
  } else {
    // Old NAICS no longer in dataset — user must re-pick.
    migrated.naicsCode = "";
    migrated.naicsCategory = "";
    migrated._migrationNote = "industry_repick_required";
  }

  if (!migrated.categoryExposure) migrated.categoryExposure = {};
  if (!migrated.industryAnswers) migrated.industryAnswers = {};

  return migrated;
}

const NAICS_CATEGORIES = ["Construction", "Manufacturing", "Real Estate", "Hospitality"];

// ── CATEGORY EXPOSURE FIELDS ──────────────────────────────────────
// Numeric exposure fields collected for every NAICS in a given category.
const CATEGORY_QUESTIONS = {
  "Construction": [
    { id: "subcost", label: "Annual Subcontractor Cost", type: "currency", placeholder: "$0" },
  ],
  "Manufacturing": [
    // employee counts handled by general "Total Employees" field
  ],
  "Real Estate": [
    { id: "units", label: "Number of Units", type: "number", placeholder: "0" },
    { id: "square_footage", label: "Total Square Footage", type: "number", placeholder: "0" },
  ],
  "Hospitality": [
    { id: "alcohol_pct", label: "% of Sales from Alcohol", type: "percent", placeholder: "0" },
    { id: "square_footage", label: "Total Square Footage", type: "number", placeholder: "0" },
  ],
};

// ── CATEGORY-LEVEL WEIGHTED RISK QUESTIONS ────────────────────────
// Universal underwriting questions that apply to every NAICS in that category.
// These render in addition to any code-specific questions in INDUSTRY_QUESTIONS.
// Question IDs are prefixed `cat_` to avoid collisions with code-specific question IDs.
const CATEGORY_RISK_QUESTIONS = {
  "Construction": {
    label: "Construction",
    questions: [
      { id: "cat_safety_program", label: "Is there a documented written safety program with regular toolbox talks?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
      { id: "cat_years_operation", label: "How long has the business been operating?", type: "select", options: ["< 2 years", "2 – 5 years", "5 – 10 years", "10+ years"], weights: { "< 2 years": 0.5, "2 – 5 years": 0.2, "5 – 10 years": 0.0, "10+ years": -0.3 } },
      { id: "cat_sub_certs", label: "Are certificates of insurance required and verified for ALL subcontractors?", type: "boolean", weights: { "true": -0.4, "false": 0.7 } },
      { id: "cat_osha_history", label: "Any OSHA citations or penalties in the past 3 years?", type: "boolean", weights: { "true": 0.7, "false": -0.1 } },
      { id: "cat_highway_work", label: "Does any work occur in active highway or traffic work zones?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "cat_heavy_equipment", label: "Does the business own and operate heavy equipment (cranes, excavators, lifts)?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "cat_prior_losses", label: "Any single workers' comp loss greater than $25,000 in the past 3 years?", type: "boolean", weights: { "true": 0.6, "false": -0.2 } },
    ],
  },
  "Manufacturing": {
    label: "Manufacturing",
    questions: [
      { id: "cat_safety_program", label: "Is there a documented written safety program with mandatory PPE?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
      { id: "cat_loto", label: "Is a documented lockout/tagout program in place for machinery?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "cat_heavy_machinery", label: "Is heavy or moving machinery (presses, stamping, conveyors) used in production?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "cat_hazmat", label: "Are hazardous chemicals, solvents, or flammables handled or stored on-site?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "cat_forklifts", label: "Are forklifts or powered industrial trucks operated daily?", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
      { id: "cat_years_operation", label: "How long has the business been operating?", type: "select", options: ["< 2 years", "2 – 5 years", "5 – 10 years", "10+ years"], weights: { "< 2 years": 0.5, "2 – 5 years": 0.2, "5 – 10 years": 0.0, "10+ years": -0.3 } },
      { id: "cat_prior_losses", label: "Any single workers' comp loss greater than $25,000 in the past 3 years?", type: "boolean", weights: { "true": 0.6, "false": -0.2 } },
    ],
  },
  "Real Estate": {
    label: "Real Estate",
    questions: [
      { id: "cat_inspection_schedule", label: "Is there a documented routine inspection schedule for all premises?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "cat_slip_falls", label: "Any slip-and-fall or premises liability claims in the past 3 years?", type: "boolean", weights: { "true": 0.6, "false": -0.2 } },
      { id: "cat_amenities", label: "Are there amenities like pool, gym, or playground on-premises?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "cat_24_7_staff", label: "Is there 24/7 on-site staff or security?", type: "boolean", weights: { "true": -0.3, "false": 0.2 } },
      { id: "cat_vacancy", label: "Any units or properties vacant for more than 30 days?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "cat_high_crime", label: "Are properties located in a high-crime area or district?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },
  "Hospitality": {
    label: "Hospitality",
    questions: [
      { id: "cat_safety_program", label: "Is there a documented food-safety, sanitation, or guest-safety program?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
      { id: "cat_liquor_license", label: "Does the business hold a liquor license?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "cat_late_hours", label: "Does the business serve customers past 1am?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "cat_entertainment", label: "Are live entertainment, DJ, or ticketed events offered?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "cat_prior_claims", label: "Any food-illness, slip-and-fall, or assault claims in the past 3 years?", type: "boolean", weights: { "true": 0.7, "false": -0.2 } },
      { id: "cat_years_operation", label: "How long has the business been operating?", type: "select", options: ["< 2 years", "2 – 5 years", "5 – 10 years", "10+ years"], weights: { "< 2 years": 0.5, "2 – 5 years": 0.2, "5 – 10 years": 0.0, "10+ years": -0.3 } },
      { id: "cat_security", label: "Is licensed security present during peak / high-traffic hours?", type: "boolean", weights: { "true": -0.3, "false": 0.3 } },
    ],
  },
};

// ── INDUSTRY-SPECIFIC WEIGHTED QUESTIONS ──────────────────────────
// Keyed by NAICS code (string). Each key has { label, questions: [...] }.
// Each question: { id, label, hint?, type: "boolean"|"select", weights: {value: numericRiskAdjustment} }
// Positive weight = adds risk. Negative weight = reduces risk.
const INDUSTRY_QUESTIONS = {
  "238160": {
    label: "Roofing Contractors",
    questions: [
      { id: "steep_slope", label: "Does the contractor work on steep-slope roofs (>4:12 pitch)?", hint: "Steep-slope work has materially higher fall exposure.", type: "boolean", weights: { "true": 0.8, "false": -0.2 } },
      { id: "max_height", label: "What is the typical maximum working height?", type: "select", options: ["Single story", "2 stories", "3+ stories", "Commercial / 4+ stories"], weights: { "Single story": -0.3, "2 stories": 0.0, "3+ stories": 0.5, "Commercial / 4+ stories": 1.0 } },
      { id: "fall_protection", label: "Is a documented fall-protection program enforced on every job?", hint: "OSHA written program with weekly toolbox talks.", type: "boolean", weights: { "true": -0.5, "false": 0.6 } },
      { id: "uninsured_subs", label: "Does the contractor use any uninsured subcontractors?", type: "boolean", weights: { "true": 0.9, "false": -0.2 } },
    ],
  },
  "236220": {
    label: "Commercial Building Construction",
    questions: [
      { id: "project_size", label: "What is the typical project size?", type: "select", options: ["< $1M", "$1M – $5M", "$5M – $25M", "> $25M"], weights: { "< $1M": -0.2, "$1M – $5M": 0.0, "$5M – $25M": 0.3, "> $25M": 0.6 } },
      { id: "self_perform", label: "Does the GC self-perform any trade work?", hint: "Self-performed structural / framing increases exposure.", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "safety_program", label: "Is there a written safety program with on-site safety officer?", type: "boolean", weights: { "true": -0.5, "false": 0.5 } },
      { id: "subs_certificates", label: "Are certificates of insurance collected from every subcontractor?", type: "boolean", weights: { "true": -0.3, "false": 0.7 } },
    ],
  },
  "238210": {
    label: "Electrical Contractors",
    questions: [
      { id: "voltage_class", label: "What voltage class do they primarily work on?", type: "select", options: ["Low (< 600V)", "Medium (600V – 15kV)", "High (> 15kV)"], weights: { "Low (< 600V)": -0.2, "Medium (600V – 15kV)": 0.3, "High (> 15kV)": 0.7 } },
      { id: "energized_work", label: "Do they perform any work on energized circuits?", type: "boolean", weights: { "true": 0.6, "false": -0.3 } },
      { id: "licensed_journeymen", label: "Are at least 50% of field workers licensed journeymen?", type: "boolean", weights: { "true": -0.4, "false": 0.4 } },
      { id: "lockout_program", label: "Is a documented lockout/tagout program in place?", type: "boolean", weights: { "true": -0.3, "false": 0.5 } },
    ],
  },
  "238220": {
    label: "Plumbing & HVAC",
    questions: [
      { id: "service_type", label: "Primary service mix?", type: "select", options: ["Service / repair", "New construction", "Mixed"], weights: { "Service / repair": -0.2, "New construction": 0.2, "Mixed": 0.0 } },
      { id: "boiler_work", label: "Do they install or service boilers / pressure vessels?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "trenching", label: "Do they perform trenching deeper than 5 feet?", hint: "Trench collapses are a leading cause of fatalities.", type: "boolean", weights: { "true": 0.6, "false": -0.2 } },
      { id: "after_hours", label: "Do they offer 24/7 emergency response?", hint: "Fatigue and night driving raise auto exposure.", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
    ],
  },
  "238910": {
    label: "Site Preparation",
    questions: [
      { id: "excavation_depth", label: "Typical excavation depth?", type: "select", options: ["< 5 ft", "5 – 15 ft", "> 15 ft"], weights: { "< 5 ft": -0.2, "5 – 15 ft": 0.4, "> 15 ft": 0.9 } },
      { id: "shoring", label: "Is shoring / sloping / benching used per OSHA on every job >5ft?", type: "boolean", weights: { "true": -0.5, "false": 0.8 } },
      { id: "competent_person", label: "Is a designated competent person on every active site?", type: "boolean", weights: { "true": -0.3, "false": 0.6 } },
      { id: "blasting", label: "Do they perform any blasting operations?", type: "boolean", weights: { "true": 1.2, "false": -0.1 } },
    ],
  },
  "722511": {
    label: "Full-Service Restaurants",
    questions: [
      { id: "alcohol_pct", label: "What % of sales is alcohol?", type: "select", options: ["0%", "1 – 25%", "26 – 50%", "> 50%"], weights: { "0%": -0.3, "1 – 25%": 0.0, "26 – 50%": 0.4, "> 50%": 0.8 } },
      { id: "delivery_owned", label: "Does the restaurant own / operate delivery vehicles?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },
  "722410": {
    label: "Drinking Places (Bars)",
    questions: [
      { id: "late_hours", label: "Does the bar serve past 1am?", type: "boolean", weights: { "true": 0.7, "false": -0.2 } },
      { id: "tam_training", label: "Are all servers TIPS / TAM certified?", type: "boolean", weights: { "true": -0.5, "false": 0.6 } },
      { id: "security", label: "Is licensed security present on weekend nights?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "id_scanner", label: "Is an electronic ID scanner used at the door?", type: "boolean", weights: { "true": -0.3, "false": 0.3 } },
    ],
  },
  "311615": {
    label: "Poultry Processing",
    questions: [
      { id: "automation", label: "Level of automation on the processing line?", type: "select", options: ["Manual", "Semi-automated", "Fully automated"], weights: { "Manual": 0.6, "Semi-automated": 0.1, "Fully automated": -0.4 } },
      { id: "machine_guarding", label: "Are all moving parts properly guarded with documented inspections?", type: "boolean", weights: { "true": -0.5, "false": 0.7 } },
      { id: "ergo_program", label: "Is there an ergonomics program for repetitive-motion injury?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
      { id: "ammonia_refrig", label: "Is ammonia refrigeration used?", hint: "Triggers PSM if >10,000 lbs onsite.", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },
  "311611": {
    label: "Animal Slaughtering",
    questions: [
      { id: "species", label: "Primary species processed?", type: "select", options: ["Poultry", "Pork", "Beef / large cattle", "Mixed"], weights: { "Poultry": 0.0, "Pork": 0.3, "Beef / large cattle": 0.7, "Mixed": 0.4 } },
      { id: "cut_resistant_ppe", label: "Are cut-resistant gloves and aprons mandatory?", type: "boolean", weights: { "true": -0.5, "false": 0.7 } },
      { id: "knife_sharpening", label: "Is a formal knife-sharpening program in place?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "lockout_program", label: "Is a documented lockout/tagout program in place?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
    ],
  },
  "332710": {
    label: "Machine Shops",
    questions: [
      { id: "cnc_pct", label: "What % of work is CNC vs. manual machining?", type: "select", options: ["100% manual", "Mostly manual", "Mixed", "Mostly CNC", "100% CNC"], weights: { "100% manual": 0.5, "Mostly manual": 0.3, "Mixed": 0.0, "Mostly CNC": -0.2, "100% CNC": -0.4 } },
      { id: "guarding", label: "Are all machines properly guarded with interlocks?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "metalworking_fluids", label: "Is there a metalworking fluid management / mist control program?", type: "boolean", weights: { "true": -0.2, "false": 0.3 } },
      { id: "young_workers", label: "Any workers under age 18?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },
  "721110": {
    label: "Hotels & Motels",
    questions: [
      { id: "pool_spa", label: "Is there an unsupervised pool, spa, or hot tub?", type: "boolean", weights: { "true": 0.6, "false": -0.2 } },
      { id: "shuttle_service", label: "Does the property operate a shuttle or vehicle for guests?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "valet_service", label: "Does the property offer valet parking?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "security_protocol", label: "Are documented guest-safety / security protocols in place?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
    ],
  },
  "531110": {
    label: "Lessors of Residential Buildings",
    questions: [
      { id: "unit_count", label: "Total unit count under management?", type: "select", options: ["1 – 10", "11 – 50", "51 – 200", "200+"], weights: { "1 – 10": -0.2, "11 – 50": 0.0, "51 – 200": 0.3, "200+": 0.5 } },
      { id: "amenities", label: "Pool / playground / gym on-site?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "tenant_screening", label: "Is a documented tenant screening process used?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "deferred_maint", label: "Any deferred maintenance items currently open?", type: "boolean", weights: { "true": 0.6, "false": -0.2 } },
    ],
  },
  // ─── Additional Construction codes ──────────────────────────────
  "236115": {
    label: "Single-Family Housing Construction",
    questions: [
      { id: "homes_per_year", label: "How many homes built per year?", type: "select", options: ["< 5", "5 – 25", "25 – 100", "100+"], weights: { "< 5": -0.2, "5 – 25": 0.0, "25 – 100": 0.3, "100+": 0.5 } },
      { id: "spec_vs_custom", label: "Primary build type?", type: "select", options: ["Custom only", "Mixed", "Spec only"], weights: { "Custom only": 0.0, "Mixed": 0.1, "Spec only": 0.3 } },
      { id: "warranty_provided", label: "Is a written 1-year workmanship + 10-year structural warranty provided?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "self_perform_framing", label: "Does the GC self-perform framing or roofing?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
    ],
  },
  "237310": {
    label: "Highway, Street, and Bridge Construction",
    questions: [
      { id: "bridge_work", label: "Does the contractor perform bridge work (over rivers, gorges, or roadways)?", type: "boolean", weights: { "true": 0.8, "false": -0.2 } },
      { id: "traffic_control", label: "Is a certified flagger / traffic-control plan used on every job?", type: "boolean", weights: { "true": -0.5, "false": 0.7 } },
      { id: "night_work", label: "Is any work performed at night?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "dot_compliance", label: "Is the contractor in good standing with state DOT prequalification?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
    ],
  },
  "237120": {
    label: "Oil and Gas Pipeline Construction",
    questions: [
      { id: "pipeline_pressure", label: "Highest pressure class of pipelines worked on?", type: "select", options: ["Low (< 250 psi)", "Medium (250 – 1000 psi)", "High (> 1000 psi)"], weights: { "Low (< 250 psi)": -0.2, "Medium (250 – 1000 psi)": 0.3, "High (> 1000 psi)": 0.8 } },
      { id: "horizontal_drilling", label: "Is horizontal directional drilling (HDD) performed?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "operator_qualification", label: "Are all welders / operators DOT OQ-qualified?", type: "boolean", weights: { "true": -0.5, "false": 0.7 } },
      { id: "wetlands_work", label: "Any work in wetlands or environmentally sensitive areas?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
    ],
  },
  "238110": {
    label: "Concrete Foundation Contractors",
    questions: [
      { id: "max_pour_size", label: "Largest typical pour size?", type: "select", options: ["Residential (< 50 yd³)", "Light commercial (50 – 200 yd³)", "Heavy commercial (> 200 yd³)"], weights: { "Residential (< 50 yd³)": -0.1, "Light commercial (50 – 200 yd³)": 0.2, "Heavy commercial (> 200 yd³)": 0.5 } },
      { id: "pump_truck_owned", label: "Does the contractor own and operate concrete pump trucks?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "form_work", label: "Is heavy form work (>8ft walls) performed?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "rebar_placement", label: "Does the contractor self-perform rebar placement?", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
    ],
  },
  "238120": {
    label: "Structural Steel and Precast Concrete Contractors",
    questions: [
      { id: "max_height_steel", label: "Maximum erection height?", type: "select", options: ["< 30 ft", "30 – 75 ft", "75 – 150 ft", "> 150 ft"], weights: { "< 30 ft": 0.0, "30 – 75 ft": 0.4, "75 – 150 ft": 0.8, "> 150 ft": 1.2 } },
      { id: "crane_operator_certified", label: "Are all crane operators NCCCO certified?", type: "boolean", weights: { "true": -0.5, "false": 0.7 } },
      { id: "fall_arrest", label: "Is 100% tie-off / fall-arrest enforced above 6 ft?", type: "boolean", weights: { "true": -0.5, "false": 0.8 } },
      { id: "welding_certifications", label: "Do welders hold current AWS certifications?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
    ],
  },
  "238330": {
    label: "Flooring Contractors",
    questions: [
      { id: "primary_material", label: "Primary flooring type?", type: "select", options: ["Carpet / vinyl", "Hardwood / laminate", "Tile / stone", "Epoxy / industrial"], weights: { "Carpet / vinyl": -0.1, "Hardwood / laminate": 0.0, "Tile / stone": 0.2, "Epoxy / industrial": 0.4 } },
      { id: "knee_protection", label: "Are kneepads / knee-protection PPE provided and required?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "vapor_solvents", label: "Are vapor-emitting solvents or adhesives used?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "commercial_pct", label: "What % of work is commercial vs residential?", type: "select", options: ["< 25% commercial", "25 – 75% commercial", "> 75% commercial"], weights: { "< 25% commercial": -0.1, "25 – 75% commercial": 0.1, "> 75% commercial": 0.3 } },
    ],
  },

  // ─── Additional Manufacturing codes ─────────────────────────────
  "311811": {
    label: "Retail Bakeries",
    questions: [
      { id: "deep_fryer", label: "Are deep fryers or large frying surfaces used?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "delivery_owned", label: "Does the bakery operate owned delivery vehicles?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "wholesale_pct", label: "What % of revenue is wholesale vs. retail walk-in?", type: "select", options: ["< 25% wholesale", "25 – 75% wholesale", "> 75% wholesale"], weights: { "< 25% wholesale": -0.1, "25 – 75% wholesale": 0.1, "> 75% wholesale": 0.3 } },
    ],
  },
  "312120": {
    label: "Breweries",
    questions: [
      { id: "annual_barrels", label: "Approximate annual production?", type: "select", options: ["< 1,000 bbl (nano)", "1,000 – 15,000 bbl (micro)", "15,000 – 60,000 bbl (regional)", "> 60,000 bbl (large)"], weights: { "< 1,000 bbl (nano)": -0.1, "1,000 – 15,000 bbl (micro)": 0.0, "15,000 – 60,000 bbl (regional)": 0.3, "> 60,000 bbl (large)": 0.5 } },
      { id: "taproom_open", label: "Is there an on-site taproom or brewpub open to the public?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "co2_handling", label: "Are CO₂ / pressurized vessels handled with documented PSM training?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "self_distributed", label: "Does the brewery self-distribute (own delivery vehicles)?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
    ],
  },
  "312140": {
    label: "Distilleries",
    questions: [
      { id: "spirit_type", label: "Primary product?", type: "select", options: ["Spirits only", "Spirits + tasting room", "Spirits + full bar / restaurant"], weights: { "Spirits only": 0.0, "Spirits + tasting room": 0.3, "Spirits + full bar / restaurant": 0.7 } },
      { id: "ethanol_storage", label: "Is bulk ethanol (> 1,000 gallons) stored on-site?", type: "boolean", weights: { "true": 0.6, "false": -0.1 } },
      { id: "sprinkler_system", label: "Is a fire sprinkler system with foam-suppression installed?", type: "boolean", weights: { "true": -0.5, "false": 0.7 } },
      { id: "still_type", label: "Type of still operation?", type: "select", options: ["Manual / pot still", "Semi-automated", "Continuous / column"], weights: { "Manual / pot still": 0.3, "Semi-automated": 0.1, "Continuous / column": -0.1 } },
    ],
  },
  "321113": {
    label: "Sawmills",
    questions: [
      { id: "log_diameter", label: "Maximum log diameter handled?", type: "select", options: ["< 12 in", "12 – 24 in", "24 – 36 in", "> 36 in"], weights: { "< 12 in": -0.1, "12 – 24 in": 0.2, "24 – 36 in": 0.5, "> 36 in": 0.8 } },
      { id: "blade_guards", label: "Are all saw blades and rip operations properly guarded with documented inspections?", type: "boolean", weights: { "true": -0.5, "false": 0.8 } },
      { id: "dust_collection", label: "Is a NFPA-compliant dust collection system in place?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "kiln_drying", label: "Is on-site kiln drying performed?", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
    ],
  },
  "326211": {
    label: "Tire Manufacturing",
    questions: [
      { id: "tire_class", label: "Primary product class?", type: "select", options: ["Passenger / light", "Truck / commercial", "Heavy off-road / industrial"], weights: { "Passenger / light": 0.0, "Truck / commercial": 0.3, "Heavy off-road / industrial": 0.6 } },
      { id: "rubber_solvents", label: "Are organic solvent-based bonding agents used?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "press_guarding", label: "Are tire-curing presses fully guarded with two-hand controls?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "automation_level", label: "Level of automation on the build line?", type: "select", options: ["Manual", "Semi-automated", "Fully automated"], weights: { "Manual": 0.5, "Semi-automated": 0.1, "Fully automated": -0.3 } },
    ],
  },
  "331110": {
    label: "Iron and Steel Mills",
    questions: [
      { id: "molten_metal", label: "Is molten metal handled (foundry / casting operations)?", type: "boolean", weights: { "true": 0.8, "false": -0.2 } },
      { id: "high_voltage", label: "Are arc furnaces or high-voltage equipment in use?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "ppe_program", label: "Is there a documented heat / molten-metal PPE program (face shields, aprons, spats)?", type: "boolean", weights: { "true": -0.5, "false": 0.8 } },
      { id: "crane_operations", label: "Are overhead cranes used to move material > 5 tons?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
    ],
  },
  "333120": {
    label: "Construction Machinery Manufacturing",
    questions: [
      { id: "machine_size", label: "Largest equipment manufactured?", type: "select", options: ["< 5 tons", "5 – 20 tons", "20 – 100 tons", "> 100 tons"], weights: { "< 5 tons": 0.0, "5 – 20 tons": 0.2, "20 – 100 tons": 0.4, "> 100 tons": 0.6 } },
      { id: "field_testing", label: "Is field testing of equipment performed off-site?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "welding_pct", label: "What % of production involves heavy welding?", type: "select", options: ["< 25%", "25 – 50%", "> 50%"], weights: { "< 25%": -0.1, "25 – 50%": 0.2, "> 50%": 0.4 } },
      { id: "hydraulics_test", label: "Are high-pressure hydraulic systems tested in-house?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
    ],
  },
  "336411": {
    label: "Aircraft Manufacturing",
    questions: [
      { id: "aircraft_type", label: "Primary aircraft type?", type: "select", options: ["Light / general aviation", "Commercial regional", "Commercial wide-body", "Military / defense"], weights: { "Light / general aviation": 0.0, "Commercial regional": 0.2, "Commercial wide-body": 0.4, "Military / defense": 0.5 } },
      { id: "faa_certified", label: "Is the facility FAA Production Certificate (PC) holder?", type: "boolean", weights: { "true": -0.5, "false": 0.6 } },
      { id: "composite_materials", label: "Are composite materials (carbon fiber, fiberglass) handled?", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
      { id: "flight_test", label: "Are flight tests conducted on-site?", type: "boolean", weights: { "true": 0.6, "false": -0.1 } },
    ],
  },
  "336611": {
    label: "Ship Building and Repairing",
    questions: [
      { id: "vessel_size", label: "Largest vessel built or serviced?", type: "select", options: ["< 100 ft", "100 – 300 ft", "> 300 ft"], weights: { "< 100 ft": 0.0, "100 – 300 ft": 0.4, "> 300 ft": 0.8 } },
      { id: "drydock_owned", label: "Is a drydock owned and operated?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "underwater_work", label: "Is any underwater / dive work performed?", type: "boolean", weights: { "true": 0.7, "false": -0.1 } },
      { id: "uscg_compliance", label: "Is the yard USCG-inspected and in good standing?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
    ],
  },
  "339114": {
    label: "Dental Equipment and Supplies",
    questions: [
      { id: "sterile_environment", label: "Are products manufactured in an ISO Class 7 or better cleanroom?", type: "boolean", weights: { "true": -0.3, "false": 0.3 } },
      { id: "fda_registered", label: "Is the facility FDA-registered as a medical device manufacturer?", type: "boolean", weights: { "true": -0.4, "false": 0.5 } },
      { id: "implantables", label: "Are any implantable products manufactured?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },

  // ─── Additional Real Estate codes ───────────────────────────────
  "531120": {
    label: "Lessors of Nonresidential Buildings",
    questions: [
      { id: "tenant_type", label: "Primary tenant mix?", type: "select", options: ["Office", "Retail", "Industrial / warehouse", "Mixed-use"], weights: { "Office": -0.1, "Retail": 0.2, "Industrial / warehouse": 0.3, "Mixed-use": 0.1 } },
      { id: "anchor_tenants", label: "Any anchor tenants with food service or assembly use?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "ada_compliant", label: "Are all properties ADA-compliant with accessible entrances?", type: "boolean", weights: { "true": -0.3, "false": 0.5 } },
      { id: "elevator_count", label: "Number of elevators across all properties?", type: "select", options: ["0", "1 – 3", "4 – 10", "10+"], weights: { "0": -0.1, "1 – 3": 0.1, "4 – 10": 0.3, "10+": 0.5 } },
    ],
  },
  "531130": {
    label: "Self-Storage Facilities",
    questions: [
      { id: "climate_controlled", label: "Are any units climate-controlled (heating / cooling)?", type: "boolean", weights: { "true": 0.2, "false": -0.1 } },
      { id: "auto_storage", label: "Are vehicles, RVs, or boats stored on-site?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "fire_protection", label: "Is a sprinkler system installed throughout the facility?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "gate_security", label: "Is gate access controlled with individual codes + 24/7 video surveillance?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
    ],
  },
  "532120": {
    label: "Truck, Trailer, and RV Rental and Leasing",
    questions: [
      { id: "fleet_size", label: "Total fleet size?", type: "select", options: ["< 25 vehicles", "25 – 100 vehicles", "100 – 500 vehicles", "500+ vehicles"], weights: { "< 25 vehicles": -0.1, "25 – 100 vehicles": 0.2, "100 – 500 vehicles": 0.4, "500+ vehicles": 0.6 } },
      { id: "driver_screening", label: "Are renters' driving records verified before rental?", type: "boolean", weights: { "true": -0.4, "false": 0.6 } },
      { id: "max_gvwr", label: "Largest vehicle class rented?", type: "select", options: ["Light (< 10k GVWR)", "Medium (10k – 26k GVWR)", "Heavy (> 26k GVWR / CDL)"], weights: { "Light (< 10k GVWR)": 0.0, "Medium (10k – 26k GVWR)": 0.3, "Heavy (> 26k GVWR / CDL)": 0.6 } },
      { id: "telematics", label: "Are vehicles equipped with GPS / telematics?", type: "boolean", weights: { "true": -0.3, "false": 0.3 } },
    ],
  },
  "532412": {
    label: "Construction & Heavy Equipment Rental",
    questions: [
      { id: "operator_provided", label: "Is equipment ever rented with a company-provided operator?", type: "boolean", weights: { "true": 0.5, "false": -0.2 } },
      { id: "training_required", label: "Are renters required to provide proof of operator certification (e.g., NCCCO for cranes)?", type: "boolean", weights: { "true": -0.5, "false": 0.6 } },
      { id: "delivery_owned", label: "Does the rental company deliver and pick up using owned trucks/trailers?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "high_value_equipment", label: "Are any units valued over $250,000 in the fleet?", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
    ],
  },

  // ─── Additional Hospitality codes ───────────────────────────────
  "721120": {
    label: "Casino Hotels",
    questions: [
      { id: "gaming_floor", label: "Is gaming offered on-site?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "armed_security", label: "Is armed security present 24/7?", type: "boolean", weights: { "true": -0.3, "false": 0.4 } },
      { id: "high_value_assets", label: "Are high-value assets (jewelry, art, large cash holdings) stored on-premises?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "alcohol_24h", label: "Is alcohol served 24 hours a day?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },
  "721211": {
    label: "RV Parks and Campgrounds",
    questions: [
      { id: "swimming_water", label: "Are swimming pools, lakes, or water features on-site?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "atvs_horses", label: "Are ATVs, horses, or other recreational equipment offered to guests?", type: "boolean", weights: { "true": 0.6, "false": -0.1 } },
      { id: "campfires_permitted", label: "Are open campfires permitted on-site?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "seasonal_only", label: "Is the campground seasonal (closed > 3 months/yr)?", type: "boolean", weights: { "true": 0.2, "false": -0.1 } },
    ],
  },
  "722330": {
    label: "Mobile Food Services (Food Trucks)",
    questions: [
      { id: "truck_count", label: "Number of food trucks operated?", type: "select", options: ["1", "2 – 5", "6 – 15", "15+"], weights: { "1": 0.0, "2 – 5": 0.2, "6 – 15": 0.4, "15+": 0.6 } },
      { id: "propane_storage", label: "Is propane stored on-board (vs. natural gas only)?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "deep_fryer_mobile", label: "Are deep fryers used inside any truck?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
      { id: "events_catering", label: "Does the business serve at large events / festivals?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
    ],
  },
  "722513": {
    label: "Limited-Service Restaurants",
    questions: [
      { id: "drive_thru", label: "Is a drive-thru operated?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "delivery_owned", label: "Does the restaurant operate owned delivery vehicles?", type: "boolean", weights: { "true": 0.5, "false": -0.1 } },
    ],
  },
  "722515": {
    label: "Snack and Nonalcoholic Beverage Bars",
    questions: [
      { id: "hot_beverages", label: "Are hot beverages (coffee, espresso) the primary product?", type: "boolean", weights: { "true": 0.2, "false": -0.1 } },
      { id: "delivery_app", label: "Are deliveries made through 3rd-party apps using owned vehicles?", type: "boolean", weights: { "true": 0.4, "false": -0.1 } },
      { id: "drive_thru_snack", label: "Is a drive-thru window operated?", type: "boolean", weights: { "true": 0.3, "false": -0.1 } },
    ],
  },
};

// ── SCORING ───────────────────────────────────────────────────────
function computeIndustryModifier(naicsCode, answers) {
  if (!naicsCode || !answers) return 0;
  const entry = getNAICSEntry(naicsCode);
  if (!entry) return 0;

  let total = 0;

  // Layer 1 — category-level (universal underwriting questions)
  const catSet = CATEGORY_RISK_QUESTIONS[entry.category];
  if (catSet) {
    for (const q of catSet.questions) {
      const ans = answers[q.id];
      if (ans !== undefined && ans !== "" && q.weights[ans] !== undefined) {
        total += q.weights[ans];
      }
    }
  }

  // Layer 2 — code-specific drill-downs (if seeded)
  const codeSet = INDUSTRY_QUESTIONS[naicsCode];
  if (codeSet) {
    for (const q of codeSet.questions) {
      const ans = answers[q.id];
      if (ans !== undefined && ans !== "" && q.weights[ans] !== undefined) {
        total += q.weights[ans];
      }
    }
  }

  // Wider cap because we now have up to ~16 questions feeding in.
  return Math.max(-3, Math.min(4, total));
}

function computeScore(naicsCode, employees, rec, dart, industryAnswers = {}) {
  const d = getNAICSEntry(naicsCode);
  if (!d) return null;
  const maxTRC = Math.max(...NAICS_DATA.map(x => x.national_trc));
  const maxDART = Math.max(...NAICS_DATA.map(x => x.national_dart));
  const norm = 0.6 * Math.log1p(d.national_trc) / Math.log1p(maxTRC)
             + 0.4 * Math.log1p(d.national_dart) / Math.log1p(maxDART);
  let base = Math.max(1, Math.min(9.9, 1 + norm * 8.9));
  if (employees > 0) {
    // OSHA-standard estimate: 2,000 hours/year per full-time employee.
    // Used in lieu of exact hours-worked to compute incident rate per 200k hrs.
    const estimatedHours = employees * 2000;
    const aTRC  = (rec  / estimatedHours) * 200000;
    const aDART = (dart / estimatedHours) * 200000;
    const adj = Math.max(-1.5, Math.min(1.5,
      0.6 * (aTRC  / d.national_trc  - 1) +
      0.4 * (aDART / d.national_dart - 1)
    ));
    base = Math.max(1, Math.min(9.9, base + adj));
  }
  const industryMod = computeIndustryModifier(naicsCode, industryAnswers);
  return Math.max(1, Math.min(9.9, base + industryMod));
}

function matchMarkets(form) {
  const entry = form.naicsCode ? getNAICSEntry(form.naicsCode) : null;
  const industryName = entry ? entry.industry.toLowerCase() : "";
  return MARKETS_LIST.map(m => {
    const classMatch = industryName === "" || m.classes.some(c => industryName.includes(c.toLowerCase()) || c.toLowerCase().includes(industryName.split(" ")[0].toLowerCase()));
    return { ...m, matched: classMatch };
  }).sort((a, b) => {
    if (a.matched && !b.matched) return -1;
    if (!a.matched && b.matched) return 1;
    if (a.fit === "Strong" && b.fit !== "Strong") return -1;
    if (a.fit !== "Strong" && b.fit === "Strong") return 1;
    return 0;
  });
}

function scoreColor(s) { return s <= 3.5 ? C.green : s <= 6.5 ? C.amber : C.red; }
function scoreBadge(s) { return s <= 3.5 ? "LOW" : s <= 6.5 ? "MOD" : "HIGH"; }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://pk0hs5sip3.execute-api.us-east-2.amazonaws.com";

// Builds headers including the Cognito JWT. The API Gateway authorizer needs this
// to verify the user before letting the request through to the Lambda.
async function buildAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  } catch (err) {
    console.warn("Could not fetch auth session for API call", err);
  }
  return headers;
}

async function apiFetch(path, options = {}) {
  const authHeaders = await buildAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`API request failed (${response.status}): ${errText}`);
  }

  return response.json().catch(() => ({}));
}

async function fetchDraftsApi() {
  return apiFetch("/drafts");
}

async function saveDraftApi(draft) {
  return apiFetch("/drafts", { method: "POST", body: JSON.stringify(draft) });
}

async function deleteDraftApi(draftId) {
  return apiFetch(`/drafts/${encodeURIComponent(draftId)}`, { method: "DELETE" });
}

async function saveSubmissionApi(submission) {
  return apiFetch("/submissions", { method: "POST", body: JSON.stringify(submission) });
}

async function sendMarketApi(marketName, form, score) {
  return apiFetch("/markets/send", { method: "POST", body: JSON.stringify({ marketName, form, score }) });
}

// ── SHARED UI ─────────────────────────────────────────────────────
const Tag = ({ children, color = C.accent }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, background: color + "22", color, border: `1px solid ${color}44` }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "ghost", small, full, disabled }) => {
  const s = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.textMid, border: `1px solid ${C.border}` },
    success: { background: C.green + "1a", color: C.green, border: `1px solid ${C.green}44` },
    danger: { background: C.red + "1a", color: C.red, border: `1px solid ${C.red}44` },
    amber: { background: C.amber + "1a", color: C.amber, border: `1px solid ${C.amber}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...s[variant], padding: small ? "5px 11px" : "8px 16px", borderRadius: 6, fontSize: small ? 11 : 12, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, letterSpacing: 0.3, whiteSpace: "nowrap", width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1 }}>{children}</button>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px", ...style }}>{children}</div>
);

const Sec = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.textDim, textTransform: "uppercase", marginBottom: 14 }}>{children}</div>
);

const ScorePill = ({ score }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: scoreColor(score) + "18", border: `1px solid ${scoreColor(score)}44`, borderRadius: 20, padding: "2px 9px" }}>
    <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(score), fontFamily: "monospace" }}>{score.toFixed(1)}</span>
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: scoreColor(score) }}>{scoreBadge(score)}</span>
  </span>
);

function DataTable({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={{ textAlign: "left", padding: "7px 12px", fontSize: 10, letterSpacing: 1.5, color: C.textDim, borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "10px 12px", color: C.text, verticalAlign: "middle" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabBar({ tabs, active, setActive }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setActive(t.toLowerCase())}
          style={{ padding: "9px 16px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active === t.toLowerCase() ? 700 : 400, color: active === t.toLowerCase() ? C.accent : C.textMid, borderBottom: active === t.toLowerCase() ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1 }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  const color = type === "success" ? C.green : type === "amber" ? C.amber : C.red;
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, background: C.surface, border: `1px solid ${color}55`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`, minWidth: 260, animation: "slideUp 0.25s ease" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ── RUN MARKETS MODAL ─────────────────────────────────────────────
function RunMarketsModal({ form, score, onClose, onSent }) {
  const matched = matchMarkets(form);
  const [sentMarkets, setSentMarkets] = useState({});
  const [sending, setSending] = useState(null);

  const handleSend = (marketName) => {
    setSending(marketName);
    // TODO: Replace this timeout with your real AWS API call:
    // await fetch('https://your-api-gateway.amazonaws.com/prod/send-to-market', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ submission: form, market: marketName, score })
    // });
    setTimeout(() => {
      setSentMarkets(prev => ({ ...prev, [marketName]: { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), status: "Sent" } }));
      setSending(null);
      onSent(marketName);
    }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 680, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>⬡ Run Markets</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 4 }}>
              {form.businessName || "Submission"} · {getNAICSEntry(form.naicsCode)?.industry || "Unknown industry"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {score && <ScorePill score={score} />}
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Score summary */}
          {score && (
            <div style={{ background: C.bg, border: `1px solid ${scoreColor(score)}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 24 }}>
              <div><div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>RISK SCORE</div><div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(score), fontFamily: "monospace" }}>{score.toFixed(1)}</div></div>
              <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 24 }}>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>INDUSTRY</div>
                <div style={{ fontSize: 13, color: C.text }}>{getNAICSEntry(form.naicsCode)?.industry || "—"}</div>
              </div>
              <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 24 }}>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>MARKETS MATCHED</div>
                <div style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>{matched.filter(m => m.matched).length} of {matched.length}</div>
              </div>
            </div>
          )}

          {/* Recommended */}
          <Sec>Recommended Markets</Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {matched.filter(m => m.matched).map(m => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, border: `1px solid ${m.fit === "Strong" ? C.green + "33" : C.amber + "22"}`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{m.name}</span>
                    <Tag color={m.type === "Carrier" ? C.accent : C.amber}>{m.type}</Tag>
                    <Tag color={m.fit === "Strong" ? C.green : C.amber}>{m.fit} Fit</Tag>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMid }}>States: {m.states.join(", ")} · Classes: {m.classes.join(", ")}</div>
                </div>
                {sentMarkets[m.name] ? (
                  <div style={{ textAlign: "right" }}>
                    <Tag color={C.green}>✓ Sent {sentMarkets[m.name].date}</Tag>
                  </div>
                ) : (
                  <Btn variant="success" small onClick={() => handleSend(m.name)} disabled={sending === m.name}>
                    {sending === m.name ? "Sending..." : "Send ↗"}
                  </Btn>
                )}
              </div>
            ))}
          </div>

          {/* Other markets */}
          {matched.filter(m => !m.matched).length > 0 && (
            <>
              <Sec>Other Available Markets</Sec>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {matched.filter(m => !m.matched).map(m => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", opacity: 0.7 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: C.textMid }}>{m.name}</span>
                        <Tag color={m.type === "Carrier" ? C.accent : C.amber}>{m.type}</Tag>
                      </div>
                      <div style={{ fontSize: 11, color: C.textDim }}>States: {m.states.join(", ")}</div>
                    </div>
                    {sentMarkets[m.name] ? (
                      <Tag color={C.green}>✓ Sent</Tag>
                    ) : (
                      <Btn variant="ghost" small onClick={() => handleSend(m.name)} disabled={sending === m.name}>
                        {sending === m.name ? "Sending..." : "Send anyway"}
                      </Btn>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textDim }}>
            {Object.keys(sentMarkets).length > 0 ? `${Object.keys(sentMarkets).length} market${Object.keys(sentMarkets).length > 1 ? "s" : ""} notified` : "No markets sent yet"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            {Object.keys(sentMarkets).length > 0 && (
              <Btn variant="primary" onClick={onClose}>View in Pipeline →</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────
const NAV = [
  { id: "home", icon: "⌂", label: "Home" },
  { id: "new-submission", icon: "＋", label: "New Submission" },
  { id: "pipeline", icon: "◫", label: "Pipeline" },
  { id: "accounts", icon: "◉", label: "Accounts" },
  { id: "markets", icon: "◈", label: "Markets" },
];

function Sidebar({ page, setPage, setContext, draftCount, user, onLogout }) {
  return (
    <div style={{ width: 210, minHeight: "100vh", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${C.accent}, ${C.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.text, fontFamily: "monospace" }}>SYNTHRISK</div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>AGENCY PLATFORM</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(item => {
          const active = page === item.id || (item.id === "pipeline" && page === "submission-workspace") || (item.id === "accounts" && page === "account-workspace");
          const badge = item.id === "pipeline" ? (SEED_PIPELINE.length + draftCount) : null;
          return (
            <button key={item.id} onClick={() => {
                if (item.id === "new-submission") setContext({});
                setPage(item.id);
              }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: active ? C.accentGlow : "transparent", color: active ? C.accent : C.textMid, fontSize: 13, fontFamily: "inherit", fontWeight: active ? 700 : 400, marginBottom: 2, textAlign: "left" }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {badge !== null && <span style={{ marginLeft: "auto", fontSize: 10, background: C.accent + "2a", color: C.accent, borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>{(user?.name || "A").charAt(0)}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{user?.name || "Agent"}</div>
            <div style={{ fontSize: 10, color: C.textDim }}>{user?.role || "Producer"}</div>
          </div>
          <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.green }} />
        </div>
        <button onClick={onLogout} style={{ width: "100%", marginTop: 12, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Sign out</button>
      </div>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────
function HomePage({ setPage, setContext, drafts, user }) {
  const opps = SEED_ACCOUNTS.filter(a => a.score > 5.5);
  const active = SEED_PIPELINE.filter(p => ["Marketing", "Quotes"].includes(p.stage));
  const renewals = SEED_ACCOUNTS.filter(a => a.renewal.includes("Oct") || a.renewal.includes("Nov"));
  const displayName = user?.name || "Agent";
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Good morning, {displayName} 👋</div>
        <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>Here's your book at a glance · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        {[{ l: "Active Deals", v: SEED_PIPELINE.length, c: C.accent }, { l: "Saved Drafts", v: drafts.length, c: C.amber }, { l: "Bound This Month", v: 1, c: C.green }, { l: "Upcoming Renewals", v: renewals.length, c: C.red }].map(s => (
          <Card key={s.l}>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.textMid, marginTop: 4 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Saved Drafts banner */}
      {drafts.length > 0 && (
        <div style={{ background: C.amber + "11", border: `1px solid ${C.amber}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{drafts.length} saved draft{drafts.length > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: C.textMid }}>{drafts.map(d => d.businessName || "Untitled").join(", ")}</div>
            </div>
          </div>
          <Btn small variant="amber" onClick={() => setPage("pipeline")}>View Drafts →</Btn>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <Sec>New Opportunities</Sec>
          <DataTable headers={["Business", "Industry", "Score", ""]}
            rows={opps.map(a => [
              <b style={{ color: C.text }}>{a.name}</b>,
              <span style={{ color: C.textMid, fontSize: 11 }}>{a.industry}</span>,
              <ScorePill score={a.score} />,
              <Btn small variant="success" onClick={() => { setContext({ submissionAccount: a }); setPage("new-submission"); }}>Start</Btn>
            ])} />
        </Card>
        <Card>
          <Sec>Active Deals</Sec>
          <DataTable headers={["Business", "Stage", "Next Action"]}
            rows={active.map(p => [
              <button onClick={() => { setContext({ submission: p }); setPage("submission-workspace"); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{p.account}</button>,
              <Tag color={p.stage === "Quotes" ? C.green : C.amber}>{p.stage}</Tag>,
              <span style={{ fontSize: 11, color: C.textMid }}>{p.next}</span>
            ])} />
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <Sec>Upcoming Renewals</Sec>
          <DataTable headers={["Business", "Renewal", ""]}
            rows={renewals.map(a => [
              <b style={{ color: C.text }}>{a.name}</b>,
              <span style={{ color: C.amber, fontWeight: 600 }}>{a.renewal}</span>,
              <Btn small onClick={() => { setContext({}); setPage("new-submission"); }}>Renew</Btn>
            ])} />
        </Card>
        <Card>
          <Sec>Quick Actions</Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[{ l: "+ New Submission", p: "new-submission", v: "primary" }, { l: "+ Add Account", p: "accounts", v: "ghost" }, { l: "Open Pipeline", p: "pipeline", v: "ghost" }, { l: "Market Finder", p: "markets", v: "ghost" }].map(a => (
              <Btn key={a.l} variant={a.v} full onClick={() => {
                if (a.p === "new-submission") setContext({});
                setPage(a.p);
              }}>{a.l}</Btn>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── FIELD (outside component to prevent remount) ───────────────────
const Field = ({ label, k, ph, type = "text", value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>{label}</label>
    <input type={type} value={value} placeholder={ph} onChange={e => onChange(k, e.target.value)}
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" }}
      onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
  </div>
);
// ── NAICS PICKER ──────────────────────────────────────────────────
// Two-step picker: pick category first (4 buttons), then text-search & pick a NAICS code.
// Defined outside NewSubmissionPage to prevent remounting (which would lose the search input focus).
const NAICSPicker = ({ value, onChange }) => {
  const [category, setCategory] = useState(() => {
    if (!value) return "";
    return getNAICSEntry(value)?.category || "";
  });
  const [search, setSearch] = useState("");

  const codesInCategory = category
    ? NAICS_DATA.filter(e => e.category === category)
    : [];

  const filtered = search
    ? codesInCategory.filter(e =>
        e.naics.includes(search) ||
        e.industry.toLowerCase().includes(search.toLowerCase())
      )
    : codesInCategory;

  const selected = value ? getNAICSEntry(value) : null;

  // Counts per category for the buttons
  const counts = NAICS_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = NAICS_DATA.filter(e => e.category === cat).length;
    return acc;
  }, {});

  // If user changes category, clear the selected code
  const handleCategoryClick = (cat) => {
    if (cat === category) return;
    setCategory(cat);
    setSearch("");
    if (value && getNAICSEntry(value)?.category !== cat) {
      onChange("", cat);  // clear code, set new category
    } else {
      onChange(value, cat);
    }
  };

  return (
    <div>
      {/* Step 1: Category buttons */}
      <div style={{ fontSize: 11, color: C.textMid, marginBottom: 6 }}>
        1. Select industry category
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {NAICS_CATEGORIES.map(cat => {
          const active = category === cat;
          return (
            <button key={cat} onClick={() => handleCategoryClick(cat)}
              style={{
                padding: "8px 14px", borderRadius: 6,
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentGlow : "transparent",
                color: active ? C.accent : C.textMid,
                fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                fontWeight: active ? 700 : 500,
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {cat}
              <span style={{
                fontSize: 10,
                background: active ? C.accent + "33" : C.border,
                color: active ? C.accent : C.textDim,
                padding: "1px 6px", borderRadius: 8, fontWeight: 600,
              }}>{counts[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Step 2: Search + list (only after category is picked) */}
      {category && (
        <>
          <div style={{ fontSize: 11, color: C.textMid, marginBottom: 6 }}>
            2. Search and pick a NAICS code ({filtered.length} of {codesInCategory.length})
          </div>
          <input
            type="text"
            value={search}
            placeholder={`Search ${category} codes by name or NAICS number...`}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", background: C.bg, border: `1px solid ${C.border}`,
              color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13,
              fontFamily: "inherit", outline: "none", marginBottom: 8,
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />

          <div style={{
            maxHeight: 220, overflowY: "auto",
            border: `1px solid ${C.border}`, borderRadius: 6,
            background: C.bg,
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: C.textDim, fontSize: 12 }}>
                No NAICS codes match "{search}"
              </div>
            ) : (
              filtered.map(e => {
                const isSelected = e.naics === value;
                return (
                  <button key={e.naics}
                    onClick={() => onChange(e.naics, category)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "8px 12px",
                      background: isSelected ? C.accentGlow : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${C.border}`,
                      color: isSelected ? C.accent : C.text,
                      fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                      fontWeight: isSelected ? 700 : 400,
                    }}
                    onMouseEnter={e2 => { if (!isSelected) e2.currentTarget.style.background = C.surfaceHigh; }}
                    onMouseLeave={e2 => { if (!isSelected) e2.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span>{e.industry}</span>
                      <span style={{ fontSize: 10, color: isSelected ? C.accent : C.textDim, fontFamily: "monospace", fontWeight: 600, flexShrink: 0 }}>
                        {e.naics}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Selected code summary */}
      {selected && (
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: C.accentGlow, border: `1px solid ${C.accent}44`,
          borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10, color: C.accent, letterSpacing: 1, marginBottom: 2 }}>SELECTED</div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
              {selected.industry}
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: C.accent, fontWeight: 700 }}>
            {selected.naics}
          </div>
        </div>
      )}
    </div>
  );
};

// ── INDUSTRY QUESTIONS PANEL ──────────────────────────────────────
// Defined outside NewSubmissionPage to prevent remounting on each render.
// Renders TWO layers stacked: category-level questions (always shown if category exists)
// and code-specific drill-down questions (only if INDUSTRY_QUESTIONS has an entry for the NAICS).
const IndustryQuestionsPanel = ({ naicsCode, answers, onChange }) => {
  if (!naicsCode) return null;
  const entry = getNAICSEntry(naicsCode);
  if (!entry) return null;

  const categorySet = CATEGORY_RISK_QUESTIONS[entry.category];
  const codeSet = INDUSTRY_QUESTIONS[naicsCode];

  if (!categorySet && !codeSet) return null;

  const handleAnswer = (questionId, value) => {
    onChange({ ...answers, [questionId]: value });
  };

  // Render a single labeled section (category OR code-specific)
  const renderSection = (set, sectionLabel, accentColor) => {
    if (!set) return null;
    const answeredCount = set.questions.filter(q =>
      answers[q.id] !== undefined && answers[q.id] !== ""
    ).length;

    return (
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: accentColor, textTransform: "uppercase" }}>
            ◈ {sectionLabel}
          </div>
          <div style={{ fontSize: 10, color: C.textDim }}>
            {answeredCount}/{set.questions.length} answered
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {set.questions.map(q => {
            const answered = answers[q.id] !== undefined && answers[q.id] !== "";
            return (
              <div key={q.id} style={{ background: C.bg, border: `1px solid ${answered ? C.borderHigh : C.border}`, borderRadius: 8, padding: "12px 14px", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: q.hint ? 3 : 9 }}>
                  {q.label}
                </div>
                {q.hint && (
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 9 }}>{q.hint}</div>
                )}

                {/* Boolean — Yes / No toggles */}
                {q.type === "boolean" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {["Yes", "No"].map(opt => {
                      const val = opt === "Yes" ? "true" : "false";
                      const selected = answers[q.id] === val;
                      const isYes = opt === "Yes";
                      const yesWeight = q.weights["true"];
                      const riskColor = yesWeight >= 0.7 ? C.red : yesWeight >= 0.3 ? C.amber : C.green;
                      const activeColor = isYes ? riskColor : C.green;
                      return (
                        <button key={opt} onClick={() => handleAnswer(q.id, val)}
                          style={{
                            padding: "6px 20px", borderRadius: 6,
                            border: `1px solid ${selected ? activeColor : C.border}`,
                            background: selected ? activeColor + "1a" : "transparent",
                            color: selected ? activeColor : C.textMid,
                            fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                            fontWeight: selected ? 700 : 400, transition: "all 0.15s",
                          }}>
                          {opt}
                        </button>
                      );
                    })}
                    {answered && (
                      <span style={{ fontSize: 10, color: C.textDim, marginLeft: 4 }}>
                        {(() => {
                          const w = q.weights[answers[q.id]];
                          if (w > 0) return <span style={{ color: C.amber }}>+{w.toFixed(1)} risk</span>;
                          if (w < 0) return <span style={{ color: C.green }}>{w.toFixed(1)} risk</span>;
                          return <span style={{ color: C.textDim }}>neutral</span>;
                        })()}
                      </span>
                    )}
                  </div>
                )}

                {/* Select — button group */}
                {q.type === "select" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {q.options.map(opt => {
                      const selected = answers[q.id] === opt;
                      const weight = q.weights[opt];
                      const color = weight >= 0.5 ? C.red : weight > 0 ? C.amber : weight < 0 ? C.green : C.accent;
                      return (
                        <button key={opt} onClick={() => handleAnswer(q.id, opt)}
                          style={{
                            padding: "6px 12px", borderRadius: 6,
                            border: `1px solid ${selected ? color : C.border}`,
                            background: selected ? color + "1a" : "transparent",
                            color: selected ? color : C.textMid,
                            fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                            fontWeight: selected ? 700 : 400, transition: "all 0.15s",
                          }}>
                          {opt}
                          {selected && weight !== 0 && (
                            <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.8 }}>
                              {weight > 0 ? `+${weight.toFixed(1)}` : weight.toFixed(1)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Layer 1 — Category-level (universal underwriting questions) */}
      {renderSection(categorySet, `${entry.category} — General Risk Factors`, C.amber)}
      {/* Layer 2 — Code-specific drill-downs (only if seeded) */}
      {renderSection(codeSet, `${codeSet?.label || entry.industry} — Specific Risk Factors`, C.accent)}
    </div>
  );
};
// ── NEW SUBMISSION ─────────────────────────────────────────────────
function NewSubmissionPage({ context, onSaveDraft, onRunMarkets }) {
  const prefill = context?.draft || null;
  const [step, setStep] = useState(1);
  const [score, setScore] = useState(prefill?.score || null);
  const [showMarkets, setShowMarkets] = useState(false);
  const [industryAnswers, setIndustryAnswers] = useState(prefill?.industryAnswers || {});
  const [categoryExposure, setCategoryExposure] = useState(prefill?.categoryExposure || {});

  // Stable identity for this draft. Initialized from prefill when resuming,
  // generated on first save when starting fresh. Reused for every subsequent
  // save (manual or auto) so the upsert in the parent matches one record.
  const [draftId, setDraftId] = useState(prefill?.id || null);
  const [autosaveAt, setAutosaveAt] = useState(null);
  const autosaveTimerRef = useRef(null);
  const skipInitialAutosaveRef = useRef(true);
  const [form, setForm] = useState({
    businessName: prefill?.businessName || context?.submissionAccount?.name || "",
    effectiveDate: prefill?.effectiveDate || "",
    address: prefill?.address || "",
    producer: prefill?.producer || "Demetri",
    description: prefill?.description || "",
    naicsCode: prefill?.naicsCode || "",
    naicsCategory: prefill?.naicsCategory || "",
    revenue: prefill?.revenue || "",
    payroll: prefill?.payroll || "",
    years: prefill?.years || "",
    employees: prefill?.employees || "",
    recordable: prefill?.recordable || "",
    dart: prefill?.dart || "",
    glLimit: prefill?.glLimit || "$1,000,000",
    propLimit: prefill?.propLimit || "",
    losses: prefill?.losses || "No prior losses",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const STEPS = ["Insured", "Operations", "Exposure", "Losses", "Review"];

  // Called by NAICSPicker when category or code changes
  const handleNAICSChange = (code, category) => {
    setForm(f => ({ ...f, naicsCode: code, naicsCategory: category }));
    setIndustryAnswers({});
    setCategoryExposure({});
  };

  const handleCategoryAnswer = (qid, value) => {
    setCategoryExposure(prev => ({ ...prev, [qid]: value }));
  };

  const handleNext = () => {
    if (step === 4) {
      const s = computeScore(form.naicsCode, +form.employees, +form.recordable, +form.dart, industryAnswers);
      setScore(s);
    }
    setStep(s => Math.min(5, s + 1));
  };
  // Builds the draft payload. Pulled out so manual save and autosave share it.
  const buildDraftPayload = (id) => ({
    ...form,
    industryAnswers,
    categoryExposure,
    score,
    savedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    id,
    _migrationNote: form.naicsCode ? undefined : prefill?._migrationNote,
  });

  const handleSaveDraft = async () => {
    // Generate an id the first time, then reuse it forever for this session.
    const id = draftId || Date.now();
    if (!draftId) setDraftId(id);
    await onSaveDraft(buildDraftPayload(id));
  };

  // ── AUTOSAVE ──────────────────────────────────────────────────────
  // Kicks in after the user advances past Step 1. Debounced 1.5s so we don't
  // hammer the API on every keystroke. Reuses draftId so saves overwrite the
  // same record. Silent — no toast — to avoid notification spam.
  useEffect(() => {
    // Skip the initial render so we don't fire a save just for mounting.
    if (skipInitialAutosaveRef.current) {
      skipInitialAutosaveRef.current = false;
      return;
    }
    // Only autosave once the user has completed Step 1.
    if (step < 2) return;
    // Don't autosave an empty draft.
    if (!form.businessName) return;

    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      const id = draftId || Date.now();
      if (!draftId) setDraftId(id);
      try {
        await onSaveDraft(buildDraftPayload(id), { silent: true });
        setAutosaveAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        console.warn("Autosave failed", err);
      }
    }, 1500);

    return () => clearTimeout(autosaveTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, industryAnswers, categoryExposure, step, score]);
  const handleRunMarkets = () => {
    if (!score && form.naicsCode) {
      const s = computeScore(form.naicsCode, +form.employees, +form.recordable, +form.dart, industryAnswers);
      setScore(s);
    }
    setShowMarkets(true);
  };

  return (
    <div style={{ maxWidth: "100%" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
        {prefill ? `Resume Draft — ${prefill.businessName || "Untitled"}` : "New Submission"}
      </div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 24 }}>Complete all steps to generate a risk score and send to markets.</div>

      {/* Migration notice — shown when an old draft used a NAICS no longer in the dataset */}
      {prefill?._migrationNote === "industry_repick_required" && (
        <div style={{
          background: C.amber + "11", border: `1px solid ${C.amber}55`, borderRadius: 8,
          padding: "12px 16px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.amber, marginBottom: 2 }}>
              Industry classification needs to be re-selected
            </div>
            <div style={{ fontSize: 11, color: C.textMid }}>
              This draft was saved before the NAICS dataset was updated. Please re-pick the industry on Step 2 — your other answers were preserved.
            </div>
          </div>
        </div>
      )}

      {/* Step progress */}
      <div style={{ display: "flex", gap: 0, background: C.surface, borderRadius: 10, padding: 5, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        {STEPS.map((s, i) => { const n = i + 1, done = n < step, act = n === step; return (
          <button key={s} onClick={() => n <= step && setStep(n)} style={{ flex: 1, padding: "7px 2px", border: "none", borderRadius: 7, cursor: n <= step ? "pointer" : "default", background: act ? C.accent : done ? C.green + "22" : "transparent", color: act ? "#fff" : done ? C.green : C.textDim, fontSize: 10, fontFamily: "inherit", fontWeight: act ? 700 : 500 }}>
            <div style={{ fontSize: 9, marginBottom: 2 }}>{done ? "✓" : n}</div>{s}
          </button>
        ); })}
      </div>

      <Card>
        {step === 1 && <><Sec>Step 1 — Insured Information</Sec>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <Field label="Business Name" k="businessName" ph="ABC Plumbing" value={form.businessName} onChange={set} />
            <Field label="Effective Date" k="effectiveDate" type="date" value={form.effectiveDate} onChange={set} />
          </div>
          <Field label="Address" k="address" ph="123 Main St, Phoenix AZ" value={form.address} onChange={set} />
          <Field label="Producer" k="producer" ph="Agent name" value={form.producer} onChange={set} />
        </>}

        {step === 2 && <>
  <Sec>Step 2 — Operations</Sec>
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>What does the business do?</label>
    <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Describe primary operations..."
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
  </div>

  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 8 }}>NAICS Classification</label>
    <NAICSPicker value={form.naicsCode} onChange={handleNAICSChange} />
  </div>

  {/* Live score preview — updates as industry questions are answered */}
  {form.naicsCode && (() => {
    const d = getNAICSEntry(form.naicsCode);
    if (!d) return null;
    const liveScore = computeScore(form.naicsCode, 0, 0, 0, industryAnswers);
    const industryMod = computeIndustryModifier(form.naicsCode, industryAnswers);
    return (
      <div style={{ background: C.bg, borderRadius: 8, padding: "12px 16px", border: `1px solid ${scoreColor(liveScore)}33`, marginBottom: 4, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 3 }}>LIVE SCORE PREVIEW</div>
          <div style={{ fontSize: 11, color: C.textMid }}>
            Industry baseline: TRC {d.national_trc} · DART {d.national_dart}
            {industryMod !== 0 && (
              <span style={{ marginLeft: 10, color: industryMod > 0 ? C.amber : C.green, fontWeight: 700 }}>
                {industryMod > 0 ? `+${industryMod.toFixed(1)}` : industryMod.toFixed(1)} from risk factors
              </span>
            )}
          </div>
        </div>
        <ScorePill score={liveScore} />
      </div>
    );
  })()}

  {/* Industry-specific weighted questions — only render if questions exist for this NAICS */}
  <IndustryQuestionsPanel
    naicsCode={form.naicsCode}
    answers={industryAnswers}
    onChange={setIndustryAnswers}
  />

  {/* Coverage limits */}
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.textDim, textTransform: "uppercase", margin: "18px 0 10px" }}>
    Coverage
  </div>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
    <Field label="GL Limit" k="glLimit" ph="$1,000,000" value={form.glLimit} onChange={set} />
    <Field label="Property Limit" k="propLimit" ph="$500,000" value={form.propLimit} onChange={set} />
  </div>
</>}
        {step === 3 && <><Sec>Step 3 — Exposure</Sec>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <Field label="Annual Revenue" k="revenue" ph="$0" value={form.revenue} onChange={set} />
            <Field label="Annual Payroll" k="payroll" ph="$0" value={form.payroll} onChange={set} />
            <Field label="Years in Business" k="years" ph="0" type="number" value={form.years} onChange={set} />
            <Field label="Total Employees" k="employees" ph="0" type="number" value={form.employees} onChange={set} />

            {form.naicsCategory && CATEGORY_QUESTIONS[form.naicsCategory] && CATEGORY_QUESTIONS[form.naicsCategory].map(q => {
              const isCurrency = q.type === "currency";
              const isPercent = q.type === "percent";
              return (
                <div key={q.id} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>
                    {q.label}{isPercent ? " (%)" : ""}
                  </label>
                  <div style={{ position: "relative" }}>
                    {isCurrency && (
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textDim, fontSize: 13, pointerEvents: "none" }}>$</span>
                    )}
                    <input
                      type={isCurrency || isPercent ? "number" : q.type}
                      value={categoryExposure[q.id] || ""}
                      placeholder={q.placeholder}
                      onChange={e => handleCategoryAnswer(q.id, e.target.value)}
                      style={{
                        width: "100%", background: C.bg, border: `1px solid ${C.border}`,
                        color: C.text,
                        padding: isCurrency ? "9px 12px 9px 22px" : "9px 12px",
                        borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none",
                      }}
                      onFocus={e => e.target.style.borderColor = C.accent}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                    {isPercent && (
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textDim, fontSize: 13, pointerEvents: "none" }}>%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>}


        {step === 4 && <><Sec>Step 4 — Loss History</Sec>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>Loss Run Notes</label>
            <textarea value={form.losses} onChange={e => set("losses", e.target.value)} rows={3}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <Field label="Recordable Cases (3yr)" k="recordable" ph="0" type="number" value={form.recordable} onChange={set} />
            <Field label="DART Cases (3yr)" k="dart" ph="0" type="number" value={form.dart} onChange={set} />
          </div>
        </>}

   {step === 5 && <>
  <Sec>Step 5 — Review & Risk Score</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
    {[["Business", form.businessName || "—"], ["Producer", form.producer], ["Industry", getNAICSEntry(form.naicsCode)?.industry || "—"], ["GL Limit", form.glLimit || "—"], ["Employees", form.employees || "—"], ["Losses", form.losses]].map(([k, v]) => (
      <div key={k} style={{ background: C.bg, padding: "9px 12px", borderRadius: 6 }}>
        <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 3 }}>{k.toUpperCase()}</div>
        <div style={{ fontSize: 13, color: C.text }}>{v}</div>
      </div>
    ))}
  </div>

  {/* Flagged risk factors summary (combines category + code-specific layers) */}
  {form.naicsCode && (() => {
    const entry = getNAICSEntry(form.naicsCode);
    if (!entry) return null;
    const allQuestions = [
      ...((CATEGORY_RISK_QUESTIONS[entry.category]?.questions) || []),
      ...((INDUSTRY_QUESTIONS[form.naicsCode]?.questions) || []),
    ];
    if (allQuestions.length === 0) return null;
    const flags = allQuestions.filter(q => {
      const ans = industryAnswers[q.id];
      return ans !== undefined && q.weights[ans] > 0.3;
    });
    const positives = allQuestions.filter(q => {
      const ans = industryAnswers[q.id];
      return ans !== undefined && q.weights[ans] < 0;
    });
    if (flags.length === 0 && positives.length === 0) return null;
    return (
      <div style={{ background: C.bg, borderRadius: 8, padding: "12px 16px", marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, marginBottom: 10 }}>RISK FACTOR SUMMARY</div>
        {flags.map(q => (
          <div key={q.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: q.weights[industryAnswers[q.id]] >= 0.7 ? C.red : C.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.text }}>{q.label}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.amber, fontWeight: 700 }}>+{q.weights[industryAnswers[q.id]].toFixed(1)}</span>
          </div>
        ))}
        {positives.map(q => (
          <div key={q.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.text }}>{q.label}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.green, fontWeight: 700 }}>{q.weights[industryAnswers[q.id]].toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  })()}

  {score && (
    <div style={{ textAlign: "center", padding: "24px", background: C.bg, borderRadius: 10, border: `1px solid ${scoreColor(score)}33` }}>
      <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, marginBottom: 8 }}>CALCULATED RISK SCORE · v1</div>
      <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor(score), fontFamily: "monospace", lineHeight: 1 }}>{score.toFixed(1)}</div>
      <div style={{ fontSize: 11, color: scoreColor(score), marginTop: 6, letterSpacing: 2 }}>{score <= 3.5 ? "LOW RISK" : score <= 6.5 ? "MODERATE RISK" : "HIGH RISK"}</div>
    </div>
  )}
</>}

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, alignItems: "center" }}>
          <Btn variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))}>← Back</Btn>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {autosaveAt && (
              <span style={{ fontSize: 11, color: C.textDim, marginRight: 4 }}>
                Autosaved {autosaveAt}
              </span>
            )}
            <Btn variant="ghost" onClick={handleSaveDraft}>💾 Save Draft</Btn>
            {step < 5
              ? <Btn variant="primary" onClick={handleNext}>Next →</Btn>
              : <Btn variant="success" onClick={handleRunMarkets}>⬡ Run Markets</Btn>
            }
          </div>
        </div>
      </Card>

      {/* Run Markets Modal */}
      {showMarkets && (
        <RunMarketsModal
          form={form}
          score={score}
          onClose={() => setShowMarkets(false)}
          onSent={(marketName) => onRunMarkets && onRunMarkets(marketName, form)}
        />
      )}
    </div>
  );
}

// ── PIPELINE ───────────────────────────────────────────────────────
function PipelinePage({ setPage, setContext, drafts, onResumeDraft, onDeleteDraft }) {
  const [view, setView] = useState("kanban");
  const STAGES = ["Draft", "Marketing", "Quotes", "Proposal", "Bound"];
  const stageCol = { Draft: C.textDim, Marketing: C.amber, Quotes: C.accent, Proposal: "#a78bfa", Bound: C.green };

  // Merge real pipeline with drafts
  const draftItems = drafts.map(d => ({ id: `draft-${d.id}`, account: d.businessName || "Untitled Draft", stage: "Draft", score: d.score || 0, premium: "—", next: `Saved ${d.savedAt || ""}`, isDraft: true, draftData: d }));
  const allItems = [...draftItems, ...SEED_PIPELINE];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Pipeline</div>
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>My Deals · {allItems.length} total ({drafts.length} draft{drafts.length !== 1 ? "s" : ""})</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["kanban", "table"].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: view === v ? C.accentGlow : "transparent", color: view === v ? C.accent : C.textMid, fontSize: 11, fontFamily: "inherit", cursor: "pointer", fontWeight: view === v ? 700 : 400 }}>{v === "kanban" ? "⊞ Kanban" : "≡ Table"}</button>)}
          <Btn variant="primary" onClick={() => { setContext({}); setPage("new-submission"); }}>+ New</Btn>
        </div>
      </div>

      {view === "kanban" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {STAGES.map(stage => {
            const items = allItems.filter(p => p.stage === stage);
            return (
              <div key={stage}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: stageCol[stage] }}>{stage.toUpperCase()}</span>
                  <span style={{ fontSize: 10, background: C.border, borderRadius: 10, padding: "1px 7px", color: C.textMid }}>{items.length}</span>
                </div>
                {items.map(p => (
                  <div key={p.id}
                    style={{ background: C.surface, border: `1px solid ${p.isDraft ? C.amber + "44" : C.border}`, borderRadius: 8, padding: "12px 13px", cursor: "pointer", marginBottom: 8, transition: "border-color 0.15s" }}
                    onClick={() => { if (p.isDraft) { onResumeDraft(p.draftData); setPage("new-submission"); } else { setContext({ submission: p }); setPage("submission-workspace"); } }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = p.isDraft ? C.amber : C.accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = p.isDraft ? C.amber + "44" : C.border}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 7 }}>{p.account}</div>
                      {p.isDraft && <button onClick={e => { e.stopPropagation(); onDeleteDraft(p.draftData.id); }} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }} title="Delete draft">×</button>}
                    </div>
                    {p.score > 0 && <ScorePill score={p.score} />}
                    {p.isDraft && <div style={{ fontSize: 10, color: C.amber, marginTop: 6, fontWeight: 600 }}>DRAFT — click to resume</div>}
                    {!p.isDraft && <><div style={{ fontSize: 11, color: C.textMid, marginTop: 7 }}>{p.premium}</div><div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>{p.next}</div></>}
                  </div>
                ))}
                {items.length === 0 && <div style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: "20px", textAlign: "center", fontSize: 11, color: C.textDim }}>Empty</div>}
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <Card>
          <DataTable headers={["Account", "Stage", "Score", "Est. Premium", "Next Action", ""]}
            rows={allItems.map(p => [
              <button onClick={() => { if (p.isDraft) { onResumeDraft(p.draftData); setPage("new-submission"); } else { setContext({ submission: p }); setPage("submission-workspace"); } }} style={{ background: "none", border: "none", color: p.isDraft ? C.amber : C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{p.account}</button>,
              <Tag color={stageCol[p.stage]}>{p.stage}</Tag>,
              p.score > 0 ? <ScorePill score={p.score} /> : <span style={{ color: C.textDim }}>—</span>,
              <span>{p.premium}</span>,
              <span style={{ fontSize: 11, color: C.textMid }}>{p.next}</span>,
              p.isDraft ? <Btn small danger onClick={() => onDeleteDraft(p.draftData.id)}>Delete</Btn> : null
            ])} />
        </Card>
      )}
    </div>
  );
}

// ── SUBMISSION WORKSPACE ───────────────────────────────────────────
function SubmissionWorkspacePage({ context, setPage, setContext }) {
  const sub = context?.submission || SEED_PIPELINE[0];
  const [tab, setTab] = useState("overview");
  const [showMarkets, setShowMarkets] = useState(false);

  const mockForm = { businessName: sub.account, naicsCode: "", description: "", employees: "", hours: "", recordable: "", dart: "" };

  return (
    <div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, marginBottom: 5 }}>SUBMISSION</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{sub.account}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 9, alignItems: "center" }}>
              <Tag color={C.amber}>{sub.stage}</Tag>
              <ScorePill score={sub.score} />
              <span style={{ fontSize: 12, color: C.textMid }}>Est. {sub.premium}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost">💾 Save</Btn>
            <Btn variant="primary" onClick={() => setShowMarkets(true)}>⬡ Run Markets</Btn>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "9px 13px", background: C.bg, borderRadius: 6, fontSize: 12, color: C.textMid }}>
          <span style={{ color: C.amber, fontWeight: 700 }}>Next: </span>{sub.next}
        </div>
      </div>
      <TabBar tabs={["Overview", "Markets", "Quotes", "Tasks", "Docs", "Notes"]} active={tab} setActive={setTab} />
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Sec>Missing Information</Sec>
            {["Loss runs needed", "Prior carrier confirmation"].map(x => (
              <div key={x} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 9 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.text }}>{x}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Sec>Score Drivers</Sec>
            {[{ l: "Industry class", n: "Strong market fit", c: C.green }, { l: "Territory", n: "Clean — low CAT exposure", c: C.green }, { l: "Loss history", n: "Pending — loss runs needed", c: C.amber }].map(d => (
              <div key={d.l} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.c, marginTop: 5, flexShrink: 0 }} />
                <div><div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{d.l}</div><div style={{ fontSize: 11, color: C.textMid }}>{d.n}</div></div>
              </div>
            ))}
          </Card>
          <Card style={{ gridColumn: "1 / -1" }}>
            <Sec>Activity Log</Sec>
            {[{ date: "Mar 4", note: "Submission created", user: "Demetri" }, { date: "Mar 5", note: "Sent to Travelers", user: "Demetri" }, { date: "Mar 6", note: "Awaiting loss runs from insured", user: "System" }].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: C.textDim, width: 38, flexShrink: 0 }}>{a.date}</span>
                <span style={{ color: C.text }}>{a.note}</span>
                <span style={{ color: C.textDim, marginLeft: "auto" }}>{a.user}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
      {tab === "markets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <Sec>Recommended Markets</Sec>
            <DataTable headers={["Market", "Type", "Fit", ""]}
              rows={[["Travelers", "Carrier", <Tag color={C.green}>Strong</Tag>, <Btn small variant="success">Send</Btn>], ["Markel Specialty", "MGA", <Tag color={C.green}>Strong</Tag>, <Btn small variant="success">Send</Btn>], ["AmTrust MGA", "MGA", <Tag color={C.amber}>Moderate</Tag>, <Btn small>Send</Btn>]]} />
          </Card>
          <Card>
            <Sec>Active Markets</Sec>
            <DataTable headers={["Market", "Sent Date", "Status"]} rows={[["Travelers", "Mar 1", <Tag color={C.amber}>Reviewing</Tag>]]} />
          </Card>
        </div>
      )}
      {tab === "quotes" && (
        <Card>
          <Sec>Quotes Received</Sec>
          <DataTable headers={["Carrier", "Premium", "Deductible", "Status"]}
            rows={[["Travelers", <span style={{ color: C.green, fontWeight: 700 }}>$7,800</span>, "$2,500", <Tag color={C.green}>Received</Tag>], ["Markel", <span style={{ color: C.textDim }}>Pending</span>, "—", <Tag color={C.amber}>Awaiting</Tag>]]} />
        </Card>
      )}
      {["tasks", "docs", "notes"].includes(tab) && (
        <Card style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: C.textDim, marginBottom: 14 }}>No {tab} yet.</div>
          <Btn variant="ghost">+ Add {tab.slice(0, -1)}</Btn>
        </Card>
      )}
      {showMarkets && <RunMarketsModal form={mockForm} score={sub.score} onClose={() => setShowMarkets(false)} onSent={() => {}} />}
    </div>
  );
}

// ── ACCOUNTS ───────────────────────────────────────────────────────
function AccountsPage({ setPage, setContext }) {
  const [q, setQ] = useState("");
  const filtered = SEED_ACCOUNTS.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Accounts</div>
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>{SEED_ACCOUNTS.length} accounts in your book</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 13px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }} />
          <Btn variant="primary">+ Add Account</Btn>
        </div>
      </div>
      <Card>
        <DataTable headers={["Business", "Owner", "Industry", "Score", "Renewal", ""]}
          rows={filtered.map(a => [
            <button onClick={() => { setContext({ account: a }); setPage("account-workspace"); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{a.name}</button>,
            <span style={{ color: C.textMid }}>{a.owner}</span>,
            <span style={{ fontSize: 11, color: C.textMid }}>{a.industry}</span>,
            <ScorePill score={a.score} />,
            <span style={{ color: C.amber, fontWeight: 600 }}>{a.renewal}</span>,
            <Btn small onClick={() => { setContext({ submissionAccount: a }); setPage("new-submission"); }}>+ Sub</Btn>
          ])} />
      </Card>
    </div>
  );
}

// ── ACCOUNT WORKSPACE ──────────────────────────────────────────────
function AccountWorkspacePage({ context, setPage, setContext }) {
  const acct = context?.account || SEED_ACCOUNTS[0];
  const [tab, setTab] = useState("summary");
  const subs = SEED_PIPELINE.filter(p => p.accountId === acct.id);
  return (
    <div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, marginBottom: 5 }}>ACCOUNT</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{acct.name}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 9, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textMid }}>Owner: {acct.owner}</span>
              <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>Renewal: {acct.renewal}</span>
              <ScorePill score={acct.score} />
            </div>
          </div>
          <Btn variant="primary" onClick={() => { setContext({ submissionAccount: acct }); setPage("new-submission"); }}>+ New Submission</Btn>
        </div>
      </div>
      <TabBar tabs={["Summary", "Submissions", "Tasks", "Docs", "Notes"]} active={tab} setActive={setTab} />
      {tab === "summary" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Sec>Account Details</Sec>
            {[["Industry", acct.industry], ["NAICS", acct.naics], ["Owner", acct.owner], ["Renewal Date", acct.renewal]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.textMid }}>{k}</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ textAlign: "center" }}>
            <Sec>Risk Profile</Sec>
            <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(acct.score), fontFamily: "monospace" }}>{acct.score.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: scoreColor(acct.score), letterSpacing: 2, marginTop: 4 }}>{acct.score <= 3.5 ? "LOW RISK" : acct.score <= 6.5 ? "MODERATE RISK" : "HIGH RISK"}</div>
          </Card>
        </div>
      )}
      {tab === "submissions" && (
        <Card>
          <Sec>Submission History</Sec>
          {subs.length > 0 ? (
            <DataTable headers={["Stage", "Score", "Premium", "Next"]}
              rows={subs.map(p => [
                <button onClick={() => { setContext({ submission: p }); setPage("submission-workspace"); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{p.stage}</button>,
                <ScorePill score={p.score} />, p.premium,
                <span style={{ fontSize: 11, color: C.textMid }}>{p.next}</span>
              ])} />
          ) : <div style={{ textAlign: "center", padding: "30px", color: C.textDim }}>No submissions yet.</div>}
        </Card>
      )}
      {["tasks", "docs", "notes"].includes(tab) && <Card style={{ textAlign: "center", padding: "40px", color: C.textDim }}>No {tab} yet.</Card>}
    </div>
  );
}

// ── MARKETS PAGE ───────────────────────────────────────────────────
function MarketsPage() {
  const [industry, setIndustry] = useState("");
  const [fit, setFit] = useState("All");
  const filtered = MARKETS_LIST.filter(m => (fit === "All" || m.fit === fit) && (industry === "" || m.classes.some(c => c.toLowerCase().includes(industry.toLowerCase()))));
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Market Finder</div>
        <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>Find the right carrier or MGA for your submission</div>
      </div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>Industry / Class</label>
            <input placeholder="e.g. Roofing, Restaurant..." value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>Fit Level</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Strong", "Moderate"].map(f => <button key={f} onClick={() => setFit(f)} style={{ padding: "7px 13px", borderRadius: 6, border: `1px solid ${C.border}`, background: fit === f ? C.accentGlow : "transparent", color: fit === f ? C.accent : C.textMid, fontSize: 11, fontFamily: "inherit", cursor: "pointer", fontWeight: fit === f ? 700 : 400 }}>{f}</button>)}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <Sec>Results — {filtered.length} Markets</Sec>
        <DataTable headers={["Market", "Type", "Fit", "Classes", "States", ""]}
          rows={filtered.map(m => [
            <b style={{ color: C.text }}>{m.name}</b>,
            <Tag color={m.type === "Carrier" ? C.accent : C.amber}>{m.type}</Tag>,
            <Tag color={m.fit === "Strong" ? C.green : C.amber}>{m.fit}</Tag>,
            <span style={{ fontSize: 11, color: C.textMid }}>{m.classes.join(", ")}</span>,
            <span style={{ fontSize: 11, color: C.textMid }}>{m.states.join(", ")}</span>,
            <Btn small variant="success">Select</Btn>
          ])} />
      </Card>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [context, setContext] = useState({});
  const [drafts, setDrafts] = useState([]);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const nav = p => setPage(p);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

useEffect(() => {
    async function bootstrapAuth() {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setUser({
          id: currentUser.userId,
          email: attributes.email || currentUser.username,
          name: attributes.name || attributes.email?.split("@")[0] || currentUser.username,
          role: attributes["custom:role"] || "producer",
        });
      } catch (err) {
        // Expected when no session exists yet (user is on login screen).
        // Only log if it's an unexpected error.
        if (err.name !== "UserUnAuthenticatedException") {
          console.warn("Auth bootstrap failed", err);
        }
      } finally {
        setAuthLoading(false);
      }
    }

    bootstrapAuth();
  }, []);
  
  useEffect(() => {
    if (!user) return;

    async function loadDrafts() {
      try {
        const savedDrafts = await fetchDraftsApi();
        const list = Array.isArray(savedDrafts) ? savedDrafts : [];
        const migrated = list.map(migrateLegacyDraft);
        setDrafts(migrated);
      } catch (err) {
        console.warn("Draft load failed, using local state", err);
      }
    }

    loadDrafts();
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("home");
    showToast(`Welcome back, ${userData.name || "Agent"}!`, "success");
  };

const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out failed", err);
    }
    setUser(null);
    setPage("home");
    showToast("Signed out", "success");
  };

  const handleSaveDraft = async (draftData, options = {}) => {
    let apiFailed = false;
    try {
      await saveDraftApi(draftData);
    } catch (err) {
      console.warn("Draft API save failed", err);
      apiFailed = true;
    }

    setDrafts(prev => {
      const existing = prev.findIndex(d => d.id === draftData.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = draftData;
        return updated;
      }
      return [...prev, draftData];
    });

    // Suppress toast for autosaves; only show on manual Save clicks.
    // If the cloud save failed, surface that even on autosave so the user knows.
    if (apiFailed) {
      showToast("Draft saved locally — cloud sync failed", "amber");
    } else if (!options.silent) {
      showToast(`Draft saved — "${draftData.businessName || "Untitled"}"`, "amber");
    }
  };

  const handleResumeDraft = (draftData) => {
    setContext({ draft: migrateLegacyDraft(draftData) });
  };

  const handleDeleteDraft = async (draftId) => {
    try {
      await deleteDraftApi(draftId);
    } catch (err) {
      console.warn("Draft API delete failed", err);
    }

    setDrafts(prev => prev.filter(d => d.id !== draftId));
    showToast("Draft deleted", "success");
  };

  const handleRunMarkets = async (marketName, form) => {
    try {
      await sendMarketApi(marketName, form, form?.score || 0);
    } catch (err) {
      console.warn("Send market API failed", err);
    }

    showToast(`Sent to ${marketName} ✓`, "success");
  };

  const pages = {
    home: <HomePage setPage={nav} setContext={setContext} drafts={drafts} user={user} />,
    "new-submission": <NewSubmissionPage context={context} onSaveDraft={handleSaveDraft} onRunMarkets={handleRunMarkets} />,
    pipeline: <PipelinePage setPage={nav} setContext={setContext} drafts={drafts} onResumeDraft={handleResumeDraft} onDeleteDraft={handleDeleteDraft} />,
    "submission-workspace": <SubmissionWorkspacePage context={context} setPage={nav} setContext={setContext} />,
    accounts: <AccountsPage setPage={nav} setContext={setContext} />,
    "account-workspace": <AccountWorkspacePage context={context} setPage={nav} setContext={setContext} />,
    markets: <MarketsPage />,
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Loading session…</div>
          <div style={{ color: C.textMid, fontSize: 13 }}>Checking for an active Cognito session before showing the app.</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1c2030; border-radius: 2px; }
        button { transition: opacity 0.15s; }
        button:hover:not(:disabled) { opacity: 0.85; }
        tr:hover td { background: rgba(61,142,248,0.03); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Sidebar page={page} setPage={nav} setContext={setContext} draftCount={drafts.length} user={user} onLogout={handleLogout} />
      <main style={{ marginLeft: 210, padding: "28px 32px", minHeight: "100vh", width: "calc(100vw - 210px)" }}>
        {pages[page] || pages["home"]}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
