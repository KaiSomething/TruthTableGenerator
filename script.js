const statement_input = document.getElementById("equation");
const error_message = document.getElementById("error");
const table = document.getElementById("table");

const operation_priority = [
    ["\u2192", "\u2194"],
    ["\u2227", "\u2228", "\u22BC"],
    ["\u00AC"]
];

const symbols = {
    "\u2192": ["implies", "to", "->", "=>"],
    "\u2194": ["equals", "<->", "="],
    "\u00AC": ["not", "!", "~"],
    "\u22BC": ["nand"],
    "\u2227": ["and", "&"],
    "\u2228": ["or", "|"]
};

const operation_names = {
    "\u2192": "implies",
    "\u2194": "equals",
    "\u00AC": "not",
    "\u22BC": "nand",
    "\u2227": "and",
    "\u2228": "or"
}
const affector_opperations = [
    "not"
];

const true_false = [
    ["FALSE", "TRUE"],
    ["0", "1"],
    ["F", "T"]
]

var tf_index = 2;

main_tree = undefined;

function on_equation_change(){
    statement_input.value = convert_symbols(statement_input.value);
    try{
        main_tree = parse_statement(statement_input.value);
        update_table(main_tree.variables, convert_symbols(statement_input.value))
        error_message.hidden = true;
    }catch{
        error_message.hidden = false;
    }
}

function convert_symbols(input){
    output = input;
    for(var i = 0; i < Object.keys(symbols).length; i++){
        var symbol = Object.keys(symbols)[i];
        symbols[symbol].forEach(r => {
            output = output.replace(r, symbol);
        });
    }
    var regex = /[^a-zA-Z01() \u2192\u2194\u00AC\u2227\u2228]/g;
    return output.replace(regex, "");
}

function remove_duplicates(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}

function parse_statement(input, depth=0){
    var regex = /[^a-zA-Z01()\u2192\u2194\u00AC\u2227\u2228]/g;
    statement = input.replace(regex, "");

    if(input == "" || input == undefined){
        throw new Error('PANIC');
    }

    if(input.length <= 1){
        var regex = /[^a-zA-Z]/g;
        input = input.replace(regex, "");
        if(input == ""){
            throw new Error('PANIC');
        }
        return {
            "variables": [input],
            "operation_tree":input
        }
    }

    for(var i = 0; i < operation_priority.length; i++){
        var operations = operation_priority[i];
        var bracket_count = 0;
        var spaces_bracketed = 0;
        for(var t = statement.length-1; t >= 0; t--){
            if(statement[t] == ")"){
                bracket_count++;
            }
            if(bracket_count != 0){
                spaces_bracketed++;
            }
            if(statement[t] == "("){
                bracket_count--;
            }

            if(bracket_count == 0 && operations.includes(statement[t])){
                var operation = operation_names[statement[t]];
                if(affector_opperations.includes(operation)){
                    var a = statement.substring(t+1, statement.length);
                    var parsed_a = parse_statement(a, depth+1);
                    return {
                        "variables": parsed_a.variables,
                        "operation_tree":{
                            "operation": operation,
                            "a": parsed_a.operation_tree
                        }
                    }
                }
                //console.log(operation + ": " + statement.substring(0, t) + ", " + statement.substring(t+1, statement.length));
                var a = statement.substring(0, t);
                var b = statement.substring(t+1, statement.length);
                var parsed_a = parse_statement(a, depth+1);
                var parsed_b = parse_statement(b, depth+1);
                return {
                    "variables": remove_duplicates(parsed_a.variables.concat(parsed_b.variables)),
                    "operation_tree":{
                        "operation": operation,
                        "a": parsed_a.operation_tree,
                        "b": parsed_b.operation_tree
                    }
                }
            }
        }
        if(spaces_bracketed == input.length && bracket_count == 0){
            return parse_statement(statement.substring(1, statement.length-1), depth);
        }
    }
}

function run_tree(values, tree){
    if(tree == undefined){
        return undefined;
    }

    if(typeof(tree) == "string"){
        return values[tree];
    }else{
        var a = run_tree(values, tree.a);
        var b = run_tree(values, tree.b);
        if(tree.operation == "not"){
            return !a;
        }
        if(tree.operation == "implies"){
            return !(a && !b);
        }
        if(tree.operation == "or"){
            return (a || b);
        }
        if(tree.operation == "and"){
            return a && b;
        }
        if(tree.operation == "nand"){
            return a(a && b);
        }
        if(tree.operation == "equals"){
            return (a == b);
        }
    }
}

function update_table(variables, equation){
    table.innerHTML = "";

    var row_count = 2**variables.length + 1;
    var column_count = variables.length + 1;

    for(var r = 0; r < row_count; r++){
        var row = document.createElement("tr");
        var values = (r-1).toString(2).padStart(variables.length, '0');

        for(var c = 0; c < column_count; c++){
            if(r == 0){
                var square = document.createElement("th");
                if(c != variables.length){
                    square.innerText = variables[c];
                }else{
                    square.innerText = equation;
                }
            }else{
                var square = document.createElement("td");
                if(c != variables.length){
                    var tf = true_false[tf_index][parseInt(values[c])];
                    var tf = values[c] == "1";
                }else{
                    tree_values = {}
                    for(var i = 0; i < variables.length; i++){
                        tree_values[variables[i]] = values[i] == "1";
                    }
                    var tf = run_tree(tree_values, main_tree.operation_tree);
                }

                if(!tf){
                    square.innerText = true_false[tf_index][0];
                    square.classList += "false";
                }else{
                    square.innerText = true_false[tf_index][1];
                    square.classList += "true";
                }
            }
            row.appendChild(square);
        }

        table.appendChild(row);
    }
}

statement_input.oninput = on_equation_change;

on_equation_change();