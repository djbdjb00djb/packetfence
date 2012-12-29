
    /* Delete a source */
    $('#section').on('click', '[href*="/delete"]', function(event) {
        if ($(this).hasClass('disabled'))
            return false;
        var url = $(this).attr('href');
        var row = $(this).closest('tr');
        var name = row.find('[href*="/read"]').first().text();
        var modal = $('#deleteSource');
        var confirm_link = modal.find('a.btn-primary').first();
        modal.find('h3 span').html(name);
        modal.modal({ show: true });
        confirm_link.off('click');
        confirm_link.click(function() {
            $.ajax(url)
                .always(function() {
                    modal.modal('hide');
                })
                .done(function(data) {
                    $(window).hashchange();
                })
                .fail(function(jqXHR) {
                    var status_msg;
                    $("body,html").animate({scrollTop:0}, 'fast');
                    try {
                        var obj = $.parseJSON(jqXHR.responseText);
                        status_msg = obj.status_msg;
                    }
                    catch(e) {
                        status_msg = "Cannot Load Content";
                    }
                    showError($('#section h2'), status_msg);
                });
            return false;
        });

        return false;
    });

    /* Save a source */
    $('#section').on('submit', 'form[name="source"]', function(event) {
        var form = $(this),
        valid = isFormValid(form);

        if (valid) {
            resetAlert($('#section'));
            $.ajax({
                type: 'POST',
                url: form.attr('action'),
                data: form.serialize()
            }).done(function(data) {
                $('#section').fadeOut('fast', function() {
                    // Refresh the complete section
                    $(this).empty();
                    $(this).html(data);
                    $(this).fadeIn('fast', function() {
                        $('.chzn-select').chosen();
                        $('#id').focus();
                    });
                });
            }).fail(function(jqXHR) {
                var status_msg;
                $("body,html").animate({scrollTop:0}, 'fast');
                try {
                    var obj = $.parseJSON(jqXHR.responseText);
                    status_msg = obj.status_msg;
                }
                catch(e) {
                    status_msg = "Cannot Load Content";
                }
                showPermanentError(form, status_msg);
            });
        }

        return false;
    });

    /* Show a rule */
    $('#section').on('click', '#sourceRules a:not(.btn-icon)', function(event) {
        var modal = $('#modalRule');
        var url = $(this).attr('href');
        modal.empty();
        modal.modal({ shown: true });
        $.ajax(url)
            .done(function(data) {
                modal.append(data);
                modal.on('shown', function() {
                    $('#id').focus();
                });
            })
            .fail(function(jqXHR) {
                var status_msg;
                modal.modal('hide');
                $("body,html").animate({scrollTop:0}, 'fast');
                try {
                    var obj = $.parseJSON(jqXHR.responseText);
                    status_msg = obj.status_msg;
                }
                catch(e) {
                    status_msg = "Cannot Load Content";
                }
                showError($('#section h2'), status_msg);
            });

        return false;
    });

    /* Create a rule */
    $('#section').on('click', '#createRule', function(event) {
        var modal = $('#modalRule');
        var url = $(this).attr('href');
        modal.empty();
        modal.modal({ shown: true });
        $.ajax(url)
            .done(function(data) {
                modal.append(data);
            })
            .fail(function(jqXHR) {
                var status_msg;
                modal.modal('hide');
                $("body,html").animate({scrollTop:0}, 'fast');
                try {
                    var obj = $.parseJSON(jqXHR.responseText);
                    status_msg = obj.status_msg;
                }
                catch(e) {
                    status_msg = "Cannot Load Content";
                }
                showError($('#section h2'), status_msg);
            });

        return false;
    });

    /* Save a rule */
    $('#section').on('submit', 'form[name="rule"]', function(event) {
        var form = $(this),
        modal = $('#modalRule'),
        modal_body = modal.find('.modal-body').first(),
        valid = isFormValid(form);

        if (valid) {
            resetAlert(modal_body);
            // Don't submit hidden/template rows -- serialize will ignore disabled inputs
            form.find('tr.hidden :input').attr('disabled', 'disabled');
            $.ajax({
                type: 'POST',
                url: form.attr('action'),
                data: form.serialize()
            }).done(function(data) {
                modal.modal('hide');
                modal.on('hidden', function() {
                    // Refresh the complete section
                    $('#sourceRulesEmpty').closest('.control-group').fadeOut('fast', function() {
                        $(this).empty();
                        $(this).html(data);
                        $(this).fadeIn('fast', function() {
                            $('.chzn-select').chosen();
                        });
                    });
                });
            }).fail(function(jqXHR) {
                var status_msg;
                try {
                    var obj = $.parseJSON(jqXHR.responseText);
                    status_msg = obj.status_msg;
                }
                catch(e) {
                    status_msg = "Cannot Load Content";
                }
                showPermanentError(modal_body.children().first(), status_msg);
                // Restore hidden/template rows
                form.find('tr.hidden :input').removeAttr('disabled');
            });
        }

        return false;
    });

    /* Initial creation of a rule condition when no condition is defined */
    $('body').on('click', '#ruleConditionsEmpty [href="#add"]', function(event) {
        var tbody = $('#ruleConditions').children('tbody');
        var row_model = tbody.children('.hidden').first();
        if (row_model) {
            $('#ruleConditionsEmpty').addClass('hidden');
            var row_new = row_model.clone();
            row_new.removeClass('hidden');
            row_new.insertBefore(row_model);
            row_new.trigger('admin.added');
        }
        return false;
    });

    /* Initialize the rule condition and action fields when displaying a rule */
    $('#section').on('shown', '#modalRule', function(event) {
        $('#templates').find('option').removeAttr('id');
        $('#ruleConditions tr:not(.hidden) select[name$=attribute]').each(function() {
            updateCondition($(this));
        });
        $('#ruleActions tr:not(.hidden) select[name$=type]').each(function() {
            updateAction($(this), true);
        });
    });

    /* Update a rule condition input field depending on the type of the selected attribute */
    function updateCondition(attribute) {
        var type = attribute.find(':selected').attr('data-type');
        var operator = attribute.next();

        if (type != operator.attr('data-type')) {
            // Disable fields to be replaced
            var value = operator.next();
            operator.attr('disabled', 1);
            value.attr('disabled', 1);

            // Replace operator field
            var operator_new = $('#' + type + '_operator').clone();
            operator_new.attr('id', operator.attr('id'));
            operator_new.attr('name', operator.attr('name'));
            operator_new.insertBefore(operator);

            // Replace value field
            var value_new = $('#' + type + '_value').clone();
            value_new.attr('id', value.attr('id'));
            value_new.attr('name', value.attr('name'));
            value_new.insertBefore(value);

            if (!operator.attr('data-type')) {
                // Preserve values of an existing condition
                operator_new.val(operator.val());
                value_new.val(value.val());
            }

            // Remove previous fields
            value.remove();
            operator.remove();

            // Remember the data type
            operator_new.attr('data-type', type);

            // Initialize rendering widgets
            initWidgets(value_new);
        }
    }

    /* Update the rule condition fields when adding a new condition */
    $('#section').on('admin.added', '#ruleConditions tr', function(event) {
        var attribute = $(this).find('select[name$=attribute]').first();
        updateCondition(attribute);
    });

    /* Update the rule condition fields when changing a condition attribute */
    $('#section').on('change', '#ruleConditions select[name$=attribute]', function(event) {
        updateCondition($(this));
    });

    /* Update the rule action fields when changing an action type */
    $('#section').on('change', '#ruleActions select[name$=type]', function(event) {
        updateAction($(this));
    });

    /* Update the rule action fields when adding a new action */
    $('#section').on('admin.added', '#ruleActions tr:not(.hidden)', function(event) {
        var type = $(this).find('select[name$=type]').first();
        updateAction(type);
    });
