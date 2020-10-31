########### Python Form Recognizer Async Analyze #############
import json
import time
import getopt
import sys
import os
from requests import get, post

def main(argv):
    input_file, output_file, file_type = getArguments(argv)
    runAnalysis(input_file, output_file, file_type)

def runAnalysis(input_file, output_file, file_type):
    # Endpoint URL
    endpoint = r"<endpoint>"
    # Subscription Key
    apim_key = "<subscription_key>"
    # Model ID
    model_id = "<model_id>"
    # API version
    API_version = "<API_version>"

    post_url = endpoint + "/formrecognizer/%s/custom/models/%s/analyze" % (API_version, model_id)
    params = {
        "includeTextDetails": True
    }

    headers = {
        # Request headers
        'Content-Type': file_type,
        'Ocp-Apim-Subscription-Key': apim_key,
    }
    try:
        with open(input_file, "rb") as f:
            data_bytes = f.read()
    except IOError:
        print("Inputfile not accessible.")
        sys.exit(2)

    try:
        print('Initiating analysis...')
        resp = post(url = post_url, data = data_bytes, headers = headers, params = params)
        if resp.status_code != 202:
            print("POST analyze failed:\n%s" % json.dumps(resp.json()))
            quit()
        print("POST analyze succeeded:\n%s" % resp.headers)
        print
        get_url = resp.headers["operation-location"]
    except Exception as e:
        print("POST analyze failed:\n%s" % str(e))
        quit()

    n_tries = 15
    n_try = 0
    wait_sec = 5
    max_wait_sec = 60
    print()
    print('Getting analysis results...')
    while n_try < n_tries:
        try:
            resp = get(url = get_url, headers = {"Ocp-Apim-Subscription-Key": apim_key})
            resp_json = resp.json()
            if resp.status_code != 200:
                print("GET analyze results failed:\n%s" % json.dumps(resp_json))
                quit()
            status = resp_json["status"]
            if status == "succeeded":
                if output_file:
                    with open(output_file, 'w') as outfile:
                        json.dump(resp_json, outfile, indent=2, sort_keys=True)
                print("Analysis succeeded:\n%s" % json.dumps(resp_json, indent=2, sort_keys=True))
                quit()
            if status == "failed":
                print("Analysis failed:\n%s" % json.dumps(resp_json))
                quit()
            # Analysis still running. Wait and retry.
            time.sleep(wait_sec)
            n_try += 1
            wait_sec = min(2*wait_sec, max_wait_sec)     
        except Exception as e:
            msg = "GET analyze results failed:\n%s" % str(e)
            print(msg)
            quit()
    print("Analyze operation did not complete within the allocated time.")

def getArguments(argv):
    input_file = ''
    file_type = ''
    output_file = ''
    try:
        opts, args = getopt.gnu_getopt(argv, "ht:o:", [])
    except getopt.GetoptError:
        printCommandDescription(2)

    for opt, arg in opts:
        if opt == '-h':
            printCommandDescription()

    if len(args) != 1:
        printCommandDescription()
    else:
        input_file = args[0]
    
    for opt, arg in opts:
        if opt == '-t':
            if arg not in ('application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/bmp'):
                print('Type ' + file_type + ' not supported')
                sys.exit()
            else:
                file_type = arg
        
        if opt == '-o':
            output_file = arg
            try:
                open(output_file, 'a')
            except IOError:
                print("Output file not creatable")
                sys.exit(2)

    if not file_type:   
        file_type = inferrType(input_file)

    return (input_file, output_file, file_type)

def inferrType(input_file):
    filename, file_extension = os.path.splitext(input_file)
    if file_extension ==  '': 
        print('File extension could not be inferred from inputfile. Provide type as an argument.')
        sys.exit()    
    elif file_extension == '.pdf':
        return 'application/pdf'
    elif file_extension ==  '.jpeg':
        return 'image/jpeg'
    elif file_extension == '.bmp':
        return 'image/bmp'
    elif file_extension ==  '.png':
        return 'image/png'
    elif file_extension ==  '.tiff':
        return 'image/tiff'
    else:
        print('File extension ' + file_extension + ' not supported')
        sys.exit()

def printCommandDescription(exit_status=0):
    print('analyze.py <inputfile> [-t <type>] [-o <outputfile>]')
    print
    print('If type option is not provided, type will be inferred from file extension.')
    sys.exit(exit_status)

if __name__ == '__main__':
    main(sys.argv[1:])
